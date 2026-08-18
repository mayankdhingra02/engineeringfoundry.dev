import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const extensions = [".ts", ".tsx", ".js", ".mjs", ".json"];

function resolveFile(candidate) {
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  for (const extension of extensions) {
    const withExtension = `${candidate}${extension}`;
    if (existsSync(withExtension) && statSync(withExtension).isFile()) return withExtension;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return { url: "data:text/javascript,export%20{}", shortCircuit: true };
  }
  let candidate = null;
  if (specifier.startsWith("@/")) candidate = resolvePath(repositoryRoot, specifier.slice(2));
  else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    candidate = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
  }
  const resolved = candidate ? resolveFile(candidate) : null;
  if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".json")) {
    return { format: "module", source: `export default ${readFileSync(fileURLToPath(url), "utf8")};`, shortCircuit: true };
  }
  return nextLoad(url, context);
}

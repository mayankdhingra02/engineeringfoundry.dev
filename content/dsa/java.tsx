import { LanguageGuide } from "@/features/dsa/languages/language-guide";
import { javaLanguageGuide } from "./languages/java-content";

export function JavaDSAGuide() {
  return <LanguageGuide guide={javaLanguageGuide} />;
}

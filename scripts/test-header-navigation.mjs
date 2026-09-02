import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  closedHeaderNavigation,
  currentHeaderNavigationState,
  headerNavigationReducer,
} from "../lib/header-navigation.ts";

const pathname = "/";
let state = closedHeaderNavigation(pathname);

state = headerNavigationReducer(state, { type: "toggle-desktop", menu: "career", pathname });
assert.deepEqual(state, { pathname, openMenu: "career", mobileOpen: false });
state = headerNavigationReducer(state, { type: "toggle-desktop", menu: "more", pathname });
assert.deepEqual(state, { pathname, openMenu: "more", mobileOpen: false });
state = headerNavigationReducer(state, { type: "toggle-desktop", menu: "more", pathname });
assert.deepEqual(state, { pathname, openMenu: null, mobileOpen: false });

state = headerNavigationReducer(state, { type: "toggle-mobile", pathname });
assert.deepEqual(state, { pathname, openMenu: null, mobileOpen: true });
state = headerNavigationReducer(state, { type: "toggle-desktop", menu: "practice", pathname });
assert.deepEqual(state, { pathname, openMenu: "practice", mobileOpen: false });

assert.deepEqual(
  currentHeaderNavigationState(state, "/prepare"),
  { pathname: "/prepare", openMenu: null, mobileOpen: false },
  "A persisted header must render closed immediately after a route or history change.",
);
assert.deepEqual(
  headerNavigationReducer(state, { type: "toggle-mobile", pathname: "/prepare" }),
  { pathname: "/prepare", openMenu: null, mobileOpen: true },
  "The first action after a route change must start from closed state.",
);

state = headerNavigationReducer(state, { type: "close-all", pathname });
assert.deepEqual(state, closedHeaderNavigation(pathname));

const header = readFileSync("components/header.tsx", "utf8");
assert.match(header, /type="button"[\s\S]*aria-expanded=\{open\}[\s\S]*aria-controls=\{menuId\}/, "Desktop disclosure triggers must retain native button semantics and state relationships.");
assert.match(header, /onBlur=\{\(event\) => \{ if \(!event\.currentTarget\.contains\(event\.relatedTarget as Node \| null\)\) onClose\(\); \}\}/, "Tabbing outside a desktop disclosure must dismiss it.");
assert.match(header, /openDropdown\?\.contains\(target\)/, "Pointer dismissal must be scoped to the open disclosure instead of the entire header.");
assert.match(header, /window\.requestAnimationFrame\(\(\) => desktopTrigger\?\.focus\(\)\)/, "Escape must restore focus after the desktop panel unmounts.");
assert.doesNotMatch(header, /role="menu"|role="menuitem"/, "Header navigation must retain disclosure semantics instead of an incomplete ARIA menu pattern.");

const styles = readFileSync("app/globals.css", "utf8");
assert.match(styles, /@media \(min-width: 801px\) and \(max-width: 1180px\) \{\s+\.mobile-nav \{ display: grid; position: absolute;/, "The 801–1180px mobile-navigation trigger must reveal a visible panel.");

console.log("Header navigation regression passed: route-coupled disclosure state, keyboard dismissal, stable relationships, and tablet visibility hold.");

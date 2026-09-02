export type DesktopMenuId = "practice" | "career" | "more";

export type HeaderNavigationState = {
  readonly pathname: string;
  readonly openMenu: DesktopMenuId | null;
  readonly mobileOpen: boolean;
};

export type HeaderNavigationAction =
  | { readonly type: "toggle-desktop"; readonly menu: DesktopMenuId; readonly pathname: string }
  | { readonly type: "close-desktop"; readonly pathname: string }
  | { readonly type: "toggle-mobile"; readonly pathname: string }
  | { readonly type: "close-mobile"; readonly pathname: string }
  | { readonly type: "close-all"; readonly pathname: string };

export function closedHeaderNavigation(pathname: string): HeaderNavigationState {
  return { pathname, openMenu: null, mobileOpen: false };
}

export function currentHeaderNavigationState(state: HeaderNavigationState, pathname: string): HeaderNavigationState {
  return state.pathname === pathname ? state : closedHeaderNavigation(pathname);
}

export function headerNavigationReducer(state: HeaderNavigationState, action: HeaderNavigationAction): HeaderNavigationState {
  const current = currentHeaderNavigationState(state, action.pathname);

  switch (action.type) {
    case "toggle-desktop":
      return { ...current, openMenu: current.openMenu === action.menu ? null : action.menu, mobileOpen: false };
    case "close-desktop":
      return { ...current, openMenu: null };
    case "toggle-mobile":
      return { ...current, openMenu: null, mobileOpen: !current.mobileOpen };
    case "close-mobile":
      return { ...current, mobileOpen: false };
    case "close-all":
      return closedHeaderNavigation(action.pathname);
  }
}

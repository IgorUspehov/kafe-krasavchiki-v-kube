const LANDING_RELOAD_FLAG = "landing-reload-on-return";

export function markLandingReturnReload(): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(LANDING_RELOAD_FLAG, "1");
  }
}

export function consumeLandingReturnReload(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (sessionStorage.getItem(LANDING_RELOAD_FLAG) === "1") {
    sessionStorage.removeItem(LANDING_RELOAD_FLAG);
    return true;
  }
  return false;
}

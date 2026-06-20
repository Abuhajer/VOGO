const INTRO_SESSION_KEY = "vogo-intro-seen";

export function hasSeenIntroThisSession() {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(INTRO_SESSION_KEY) === "1";
}

export function markIntroSeenThisSession() {
  sessionStorage.setItem(INTRO_SESSION_KEY, "1");
}

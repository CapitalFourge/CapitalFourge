export function setAuthCookie(token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `access_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
}

export function clearAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
  }
}

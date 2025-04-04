export function isLocalStorageAvailable(): boolean {
    try {
      return typeof localStorage !== "undefined";
    } catch {
      return false;
    }
  }
  
  export function loadToken(): string | null {
    if (!isLocalStorageAvailable()) return null;
    return localStorage.getItem("github_user_token");
  }
  
  export function saveToken(token: string): void {
    if (!isLocalStorageAvailable()) return;
    localStorage.setItem("github_user_token", token);
  }
  
  export function clearToken(): void {
    if (!isLocalStorageAvailable()) return;
    localStorage.removeItem("github_user_token");
  }
  
  
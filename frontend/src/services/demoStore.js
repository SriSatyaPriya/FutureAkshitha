import { apiRequest } from "./api";

const USER_KEY = "future-akshitha:current-user";

// Non-sensitive, non-privileged UI state only. The JWT itself lives in
// sessionStorage; role always comes from the server on each authenticated API call.
export function getCurrentUser() {
  try {
    const saved = sessionStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function saveCurrentUser(user) {
  try {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    return true;
  } catch {
    return false;
  }
}

export function clearCurrentUser() {
  try {
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem("token");
    return true;
  } catch {
    return false;
  }
}

export async function logout() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore: client session will be cleared regardless
  }
  return clearCurrentUser();
}

export default { getCurrentUser, saveCurrentUser, clearCurrentUser, logout };

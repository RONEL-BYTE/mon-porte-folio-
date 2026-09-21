import { API_BASE_URL } from "../config";

function readCookie(name) {
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : "";
}

function resolveApiUrl(path) {
  if (path.startsWith("http")) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiFetch(path, options = {}) {
  const requestUrl = resolveApiUrl(path);
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  const isPublicMutation = requestUrl.includes("/api/contact") ||
    /\/api\/(projects|publications)\/[^/]+\/(like|view)/.test(requestUrl) ||
    requestUrl.includes("/api/publications/") && requestUrl.endsWith("/comments");
  const isAdminMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
    !isPublicMutation && !requestUrl.endsWith("/api/admin/login");

  if (isAdminMutation && !readCookie("csrf_token")) {
    await fetch(`${API_BASE_URL}/api/admin/csrf`, {
      credentials: "include",
    });
  }

  if (isAdminMutation) {
    const csrfToken = readCookie("csrf_token");
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  }

  return fetch(requestUrl, {
    ...options,
    headers,
    credentials: "include",
  });
}

export async function getAdminSession() {
  const response = await apiFetch("/api/admin/session");
  return response.ok;
}

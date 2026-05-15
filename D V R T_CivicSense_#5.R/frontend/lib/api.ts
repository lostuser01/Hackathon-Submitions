export const getAuthToken = () => {
  if (typeof document === "undefined") return null;
  const tokenCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("pp_token="));
  return tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1]) : null;
};

export const setAuthCookie = (token: string, days = 7) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `pp_token=${encodeURIComponent(
    token,
  )}; path=/; expires=${expires}; SameSite=Lax${secure}`;
};

export const apiFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
) => {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Prepend API URL if it's a relative path
  let url = input;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  if (typeof input === "string" && input.startsWith("/")) {
    url = `${baseUrl}${input}`;
  }

  return fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });
};


/// <reference types="vite/client" />
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function getToken() {
  return localStorage.getItem("token");
}

export async function downloadBlob(path: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 200);
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const json = await res.json();
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return new Promise(() => {}); // never resolves, prevents double error
  }
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || `HTTP ${res.status}`);
  }
  return json;
}

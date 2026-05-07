export function getBackendUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "").trim();

  if (!raw) {
    if (typeof window === "undefined") return "http://localhost:8080";
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }

  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

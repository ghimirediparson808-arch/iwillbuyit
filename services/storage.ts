// Replace this browser adapter when a backend is connected.
export function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem("iwbi-v1-" + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export function write(key: string, value: unknown, notify = true) {
  try {
    localStorage.setItem("iwbi-v1-" + key, JSON.stringify(value));
    if (notify) window.dispatchEvent(new Event("iwbi-data"));
  } catch {
    throw new Error(
      "Your browser storage is full or unavailable. Free some space and try again.",
    );
  }
}

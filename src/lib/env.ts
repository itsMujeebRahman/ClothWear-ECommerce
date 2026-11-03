export const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(
  /\/$/,
  "",
);

export const clerkPublishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

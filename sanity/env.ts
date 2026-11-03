/**
 * Sanity Studio / CLI environment. These values are only read in Node (Studio
 * config, schema extraction and TypeGen); they are never shipped to the
 * storefront bundle.
 */
import "dotenv/config";

function required(name: string, fallbackName?: string): string {
  const value =
    process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const apiVersion =
  process.env.SANITY_API_VERSION ??
  process.env.VITE_SANITY_API_VERSION ??
  "2025-05-20";

export const dataset = required("SANITY_DATASET", "VITE_SANITY_DATASET");

export const projectId = required(
  "SANITY_PROJECT_ID",
  "VITE_SANITY_PROJECT_ID",
);

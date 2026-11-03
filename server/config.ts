import "dotenv/config";

function read(name: string, fallbackName?: string): string | undefined {
  return process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
}

export const serverEnv = {
  port: Number.parseInt(process.env.PORT ?? "3001", 10),
  appUrl: read("APP_URL") ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
  clerk: {
    secretKey: read("CLERK_SECRET_KEY"),
    authorizedParties: (read("CLERK_AUTHORIZED_PARTIES") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  },
  sanity: {
    projectId: read("SANITY_PROJECT_ID", "VITE_SANITY_PROJECT_ID"),
    dataset: read("SANITY_DATASET", "VITE_SANITY_DATASET"),
    apiVersion:
      read("SANITY_API_VERSION", "VITE_SANITY_API_VERSION") ?? "2025-05-20",
    readToken: read("SANITY_API_READ_TOKEN"),
    writeToken: read("SANITY_API_TOKEN"),
  },
  stripe: {
    secretKey: read("STRIPE_SECRET_KEY"),
    webhookSecret: read("STRIPE_WEBHOOK_SECRET", "STRIPE_WEBHOOK_KEY"),
  },
} as const;

export function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing server environment variable: ${name}`);
  }
  return value;
}

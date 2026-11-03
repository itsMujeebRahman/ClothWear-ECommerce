import {
  createClerkClient,
  verifyToken,
  type ClerkClient,
} from "@clerk/backend";
import type { Request } from "express";
import { requireEnv, serverEnv } from "./config.js";
import { HttpError, MissingConfigurationError } from "./lib/errors.js";

let clerkClient: ClerkClient | null = null;

function getSecretKey(): string {
  if (!serverEnv.clerk.secretKey) {
    throw new MissingConfigurationError("Sign-in is temporarily unavailable.");
  }
  return requireEnv(serverEnv.clerk.secretKey, "CLERK_SECRET_KEY");
}

export function getClerkClient(): ClerkClient {
  if (!clerkClient) {
    clerkClient = createClerkClient({ secretKey: getSecretKey() });
  }
  return clerkClient;
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

/**
 * Verifies the Clerk session JWT on the server. The returned user id is the
 * only identity the API trusts; browser-supplied user ids/emails are ignored.
 */
export async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: getSecretKey(),
      ...(serverEnv.clerk.authorizedParties.length
        ? { authorizedParties: [...serverEnv.clerk.authorizedParties] }
        : {}),
    });
    return payload.sub || null;
  } catch {
    throw new HttpError(401, "unauthorized", "Please sign in again.");
  }
}

export async function requireAuthenticatedUserId(req: Request): Promise<string> {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    throw new HttpError(401, "unauthorized", "Please sign in to continue.");
  }
  return userId;
}

export interface CustomerIdentity {
  clerkUserId: string;
  email: string;
  name: string;
}

export async function getCustomerIdentity(
  clerkUserId: string,
): Promise<CustomerIdentity> {
  const user = await getClerkClient().users.getUser(clerkUserId);
  const primaryEmail =
    user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId,
    )?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    throw new HttpError(
      400,
      "missing_email",
      "Your account needs a verified email address before checkout.",
    );
  }

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username ||
    primaryEmail.split("@")[0] ||
    "Customer";

  return {
    clerkUserId,
    email: primaryEmail,
    name,
  };
}

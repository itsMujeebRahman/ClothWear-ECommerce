import { ClientError, createClient, type SanityClient } from "@sanity/client";
import { requireEnv, serverEnv } from "../config.js";

let readClient: SanityClient | null = null;
let writeClient: SanityClient | null = null;

function assertConfig() {
  const projectId = requireEnv(serverEnv.sanity.projectId, "SANITY_PROJECT_ID");
  const dataset = requireEnv(serverEnv.sanity.dataset, "SANITY_DATASET");
  return { projectId, dataset };
}

export function getReadClient(): SanityClient {
  if (readClient) {
    return readClient;
  }

  const { projectId, dataset } = assertConfig();
  const token = requireEnv(
    serverEnv.sanity.readToken,
    "SANITY_API_READ_TOKEN",
  );

  readClient = createClient({
    projectId,
    dataset,
    apiVersion: serverEnv.sanity.apiVersion,
    token,
    useCdn: false,
    perspective: "published",
  });

  return readClient;
}

export function getWriteClient(): SanityClient {
  if (writeClient) {
    return writeClient;
  }

  const { projectId, dataset } = assertConfig();
  const token = requireEnv(serverEnv.sanity.writeToken, "SANITY_API_TOKEN");

  writeClient = createClient({
    projectId,
    dataset,
    apiVersion: serverEnv.sanity.apiVersion,
    token,
    useCdn: false,
    perspective: "published",
  });

  return writeClient;
}

export function isDuplicateDocumentError(error: unknown): boolean {
  if (error instanceof ClientError) {
    return (
      error.statusCode === 409 ||
      /already exists|documentAlreadyExists/i.test(error.message)
    );
  }
  return (
    error instanceof Error &&
    /already exists|documentAlreadyExists/i.test(error.message)
  );
}

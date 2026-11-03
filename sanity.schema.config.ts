import { defineConfig } from "sanity";
import { dataset, projectId } from "./sanity/env";
import { schema } from "./sanity/schemaTypes";

/**
 * Schema-only configuration used by `npm run typegen`.
 *
 * The Studio config (`sanity.config.ts`) mounts the structure and vision
 * plugins, but schema extraction does not need them. Keeping this config free
 * of plugin imports also avoids a CLI/Vite SSR interop issue with the default
 * config filename.
 */
export default defineConfig({
  projectId,
  dataset,
  schema,
});

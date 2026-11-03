/**
 * This configuration file lets you run `$ sanity [command]` in this folder.
 * Go to https://www.sanity.io/docs/cli to learn more.
 *
 * The CLI runs outside Vite, so it loads `.env` directly. Server-side names
 * take precedence over the `VITE_*` values used by the storefront.
 */
import "dotenv/config";
import { defineCliConfig } from "sanity/cli";

const projectId =
  process.env.SANITY_PROJECT_ID ?? process.env.VITE_SANITY_PROJECT_ID;
const dataset =
  process.env.SANITY_DATASET ?? process.env.VITE_SANITY_DATASET;

export default defineCliConfig({
  api: { projectId, dataset },
  typegen: {
    path: "./src/**/*.{ts,tsx}",
    schema: "./schema.json",
    generates: "./src/types/sanity.types.ts",
  },
});

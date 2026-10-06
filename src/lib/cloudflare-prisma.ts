import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { PrismaD1 } from "@prisma/adapter-d1";

export type CloudflareDatabase = ConstructorParameters<typeof PrismaD1>[0];

/** Read bindings only while a request is active, never at module initialization. */
export function getCloudflareDatabaseContext(): { database: CloudflareDatabase; requestContext: object } | null {
  let context: ReturnType<typeof getCloudflareContext>;
  try {
    context = getCloudflareContext();
  } catch {
    if (process.env.PRISMA_DATABASE_PROVIDER === "d1") {
      throw new Error("Cloudflare request context is unavailable for the D1 database.");
    }
    return null;
  }
  const database = (context.env as { DB?: CloudflareDatabase }).DB;
  if (!database) {
    // A Cloudflare request must never accidentally access a local SQLite file.
    throw new Error("Cloudflare D1 binding DB is not configured.");
  }
  const requestContext = context.ctx;
  if (!requestContext || typeof requestContext !== "object") {
    throw new Error("Cloudflare execution context is unavailable for the D1 database.");
  }
  return { database, requestContext };
}

export function getD1Database(): CloudflareDatabase | null {
  return getCloudflareDatabaseContext()?.database ?? null;
}

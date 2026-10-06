import { PrismaClient } from "@prisma/client";
import { PrismaClient as WasmPrismaClient } from "@prisma/client/wasm";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareDatabaseContext } from "./cloudflare-prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let localClient: PrismaClient | undefined;
const requestClients = new WeakMap<object, { database: object; client: PrismaClient }>();

export function getPrismaClient(): PrismaClient {
  const cloudflare = getCloudflareDatabaseContext();
  if (cloudflare) {
    const cached = requestClients.get(cloudflare.requestContext);
    if (cached?.database === cloudflare.database) return cached.client;
    // Prisma 5's regular client loads a native library even with a driver
    // adapter. Workers require the generated WASM entry point explicitly.
    const client = new WasmPrismaClient({ adapter: new PrismaD1(cloudflare.database) });
    requestClients.set(cloudflare.requestContext, { database: cloudflare.database, client });
    return client;
  }
  if (!localClient) {
    localClient = globalForPrisma.prisma ?? new PrismaClient();
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = localClient;
  }
  return localClient;
}

// Keep existing `prisma.user...` imports while resolving the current request's
// client lazily. Sharing a D1 client between requests can reuse invalid I/O context.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    if (property === "then") return undefined;
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

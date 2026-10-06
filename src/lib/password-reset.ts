import { createHash } from "crypto";
import { prisma } from "./prisma";
import { getD1Database } from "./cloudflare-prisma";

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function consumeResetTokenAndUpdatePassword(
  resetRecord: { id: string; userId: string }, passwordHash: string, now = new Date(),
): Promise<void> {
  const database = getD1Database();
  if (database) {
    // D1's batch is atomic; PrismaD1's $transaction is not. Conditions are
    // rechecked inside the batch so a stale preflight read cannot replay a token.
    // Both Prisma ISO dates and legacy SQLite millisecond dates are understood.
    const unexpired = `(CASE WHEN typeof("expiresAt") IN ('integer', 'real')
      THEN "expiresAt" > ? ELSE julianday("expiresAt") > julianday(?) END)`;
    const nowIso = now.toISOString();
    const results = await database.batch([
      database.prepare(`UPDATE "User" SET "passwordHash" = ?, "updatedAt" = ?
        WHERE "id" = ? AND EXISTS (
          SELECT 1 FROM "PasswordReset" WHERE "id" = ? AND "userId" = "User"."id"
          AND "used" = 0 AND ${unexpired}
        )`).bind(passwordHash, nowIso, resetRecord.userId, resetRecord.id, now.getTime(), nowIso),
      database.prepare(`UPDATE "PasswordReset" SET "used" = 1
        WHERE "id" = ? AND "userId" = ? AND "used" = 0 AND ${unexpired}
        AND EXISTS (SELECT 1 FROM "User" WHERE "id" = "PasswordReset"."userId")`)
        .bind(resetRecord.id, resetRecord.userId, now.getTime(), nowIso),
    ]);
    if (results.length !== 2 || results.some(result => !result.success)) {
      throw new Error("RESET_DATABASE_BATCH_FAILED");
    }
    if (results[0].meta.changes !== 1 || results[1].meta.changes !== 1) {
      throw new Error("INVALID_RESET_TOKEN");
    }
    return;
  }
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordReset.updateMany({
      where: { id: resetRecord.id, userId: resetRecord.userId, used: false, expiresAt: { gt: now } },
      data: { used: true },
    });
    if (claimed.count !== 1) throw new Error("INVALID_RESET_TOKEN");
    await tx.user.update({ where: { id: resetRecord.userId }, data: { passwordHash } });
  });
}

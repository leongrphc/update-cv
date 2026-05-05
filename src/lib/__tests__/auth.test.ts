import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";

describe("Auth", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should generate different hashes for the same password", async () => {
      const password = "TestPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should verify a correct password", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);

      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);

      const result = await verifyPassword("WrongPassword", hash);
      expect(result).toBe(false);
    });
  });
});

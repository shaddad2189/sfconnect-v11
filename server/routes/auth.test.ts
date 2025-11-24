import { describe, it, expect, beforeAll } from "vitest";
import { hashPassword, verifyPassword, generateToken, verifyToken } from "../auth";
import { initializeDatabase } from "../db";

describe("Authentication", () => {
  beforeAll(async () => {
    // Initialize database before running tests
    await initializeDatabase();
  });

  describe("Password Hashing", () => {
    it("should hash a password", async () => {
      const password = "testPassword123!";
      const hash = await hashPassword(password);
      
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it("should verify correct password", async () => {
      const password = "testPassword123!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "testPassword123!";
      const wrongPassword = "wrongPassword456!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe("JWT Tokens", () => {
    it("should generate a valid JWT token", async () => {
      const token = await generateToken(1, "test@example.com", "admin");
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT has 3 parts
    });

    it("should verify a valid token", async () => {
      const userId = 1;
      const email = "test@example.com";
      const role = "admin";
      
      const token = await generateToken(userId, email, role);
      const payload = await verifyToken(token);
      
      expect(payload).toBeTruthy();
      expect(payload?.userId).toBe(userId);
      expect(payload?.email).toBe(email);
      expect(payload?.role).toBe(role);
    });

    it("should reject an invalid token", async () => {
      const invalidToken = "invalid.token.here";
      const payload = await verifyToken(invalidToken);
      
      expect(payload).toBeNull();
    });

    it("should reject a tampered token", async () => {
      const token = await generateToken(1, "test@example.com", "admin");
      const tamperedToken = token.slice(0, -5) + "xxxxx";
      const payload = await verifyToken(tamperedToken);
      
      expect(payload).toBeNull();
    });
  });
});

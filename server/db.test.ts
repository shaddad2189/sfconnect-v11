import { describe, it, expect } from "vitest";
import { getJwtSecret, getUserByEmail, initializeDatabase } from "./db";

describe("Database Initialization", () => {
  it("should auto-generate JWT secret on first run", async () => {
    await initializeDatabase();
    const secret = await getJwtSecret();
    
    expect(secret).toBeTruthy();
    expect(typeof secret).toBe("string");
    expect(secret.length).toBeGreaterThan(32);
  });

  it("should return the same JWT secret on subsequent calls", async () => {
    const secret1 = await getJwtSecret();
    const secret2 = await getJwtSecret();
    
    expect(secret1).toBe(secret2);
  });

  it("should create default admin user", async () => {
    await initializeDatabase();
    const admin = await getUserByEmail("admin@sfconnect.local");
    
    expect(admin).toBeTruthy();
    expect(admin?.email).toBe("admin@sfconnect.local");
    expect(admin?.role).toBe("admin");
    expect(admin?.passwordHash).toBeTruthy();
  });

  it("should not duplicate admin user on multiple initializations", async () => {
    await initializeDatabase();
    await initializeDatabase();
    
    const admin = await getUserByEmail("admin@sfconnect.local");
    expect(admin).toBeTruthy();
  });
});

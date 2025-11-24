import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, setupConfig, salesforceConfig, activityLog, submissions } from "../drizzle/schema";
import bcrypt from "bcrypt";
import * as crypto from "crypto";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Initialize database with default admin user and JWT secret
 */
export async function initializeDatabase() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot initialize: database not available");
    return;
  }

  try {
    // Check if JWT secret exists, if not create one
    const jwtSecretConfig = await db
      .select()
      .from(setupConfig)
      .where(eq(setupConfig.configKey, "jwt_secret"))
      .limit(1);

    if (jwtSecretConfig.length === 0) {
      const jwtSecret = crypto.randomBytes(32).toString("base64");
      await db.insert(setupConfig).values({
        configKey: "jwt_secret",
        configValue: jwtSecret,
        metadata: JSON.stringify({ auto_generated: true, created_at: new Date().toISOString() }),
      });
      console.log("[Database] JWT secret auto-generated and stored");
    }

    // Check if default admin exists
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@sfconnect.local"))
      .limit(1);

    if (adminUser.length === 0) {
      const defaultPassword = "Ch@ngE33#!!!";
      const passwordHash = await bcrypt.hash(defaultPassword, 12);

      await db.insert(users).values({
        email: "admin@sfconnect.local",
        passwordHash,
        name: "Administrator",
        role: "admin",
        emailVerified: true,
        lastSignedIn: new Date(),
      });

      console.log("[Database] Default admin user created");
      console.log("[Database] Email: admin@sfconnect.local");
      console.log("[Database] Password: Ch@ngE33#!!!");
      console.log("[Database] ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!");
    }
  } catch (error) {
    console.error("[Database] Initialization failed:", error);
  }
}

/**
 * Get JWT secret from database
 */
export async function getJwtSecret(): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(setupConfig)
    .where(eq(setupConfig.configKey, "jwt_secret"))
    .limit(1);

  if (result.length === 0) {
    throw new Error("JWT secret not found in database. Run database initialization first.");
  }

  return result[0].configValue || "";
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new user
 */
export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(users).values(user);
  return result;
}

/**
 * Update user
 */
export async function updateUser(id: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set(updates).where(eq(users.id, id));
}

/**
 * Delete user
 */
export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(users).where(eq(users.id, id));
}

/**
 * Get all users
 */
export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(users);
}

/**
 * Log user activity
 */
export async function logActivity(userId: number, action: string, details?: string, ipAddress?: string, userAgent?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log activity: database not available");
    return;
  }

  await db.insert(activityLog).values({
    userId,
    action,
    details,
    ipAddress,
    userAgent,
  });
}

/**
 * Get Salesforce configuration
 */
export async function getSalesforceConfig() {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(salesforceConfig).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Update Salesforce configuration
 */
export async function updateSalesforceConfig(config: Partial<typeof salesforceConfig.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const existing = await getSalesforceConfig();
  
  if (existing) {
    await db.update(salesforceConfig).set(config).where(eq(salesforceConfig.id, existing.id));
  } else {
    await db.insert(salesforceConfig).values(config);
  }
}

/**
 * Create submission record
 */
export async function createSubmission(submission: typeof submissions.$inferInsert) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(submissions).values(submission);
}

/**
 * Get all submissions
 */
export async function getAllSubmissions() {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(submissions);
}

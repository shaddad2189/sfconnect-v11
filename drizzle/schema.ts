import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * SF Connect Database Schema
 * Standalone application with email/password authentication, MFA, RBAC, and Salesforce integration
 */

/**
 * Users table - Authentication and user management
 * Supports email/password authentication with MFA
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  name: text("name"),
  role: mysqlEnum("role", ["admin", "operator", "readonly"]).default("operator").notNull(),
  mfaEnabled: boolean("mfaEnabled").default(false).notNull(),
  mfaSecret: text("mfaSecret"),
  salesforceId: text("salesforceId"),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Setup configuration table - Stores system configuration including JWT secret and Salesforce OAuth
 * This eliminates the need for JWT_SECRET environment variable
 */
export const setupConfig = mysqlTable("setupConfig", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("configKey", { length: 100 }).notNull().unique(),
  configValue: text("configValue"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Salesforce configuration table - OAuth tokens and Connected App credentials
 */
export const salesforceConfig = mysqlTable("salesforceConfig", {
  id: int("id").autoincrement().primaryKey(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  instanceUrl: text("instanceUrl"),
  clientId: text("clientId"),
  clientSecret: text("clientSecret"),
  connectedAppId: text("connectedAppId"),
  metadata: text("metadata"), // JSON string for additional OAuth data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Activity log table - Audit trail for compliance
 */
export const activityLog = mysqlTable("activityLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Submissions table - Contact submission tracking
 */
export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  contactName: text("contactName").notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  contactPosition: text("contactPosition"),
  companyName: text("companyName").notNull(),
  companyId: text("companyId"),
  salesforceContactId: text("salesforceContactId"),
  notes: text("notes"),
  status: mysqlEnum("status", ["success", "failed", "pending"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SetupConfig = typeof setupConfig.$inferSelect;
export type SalesforceConfig = typeof salesforceConfig.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
export type Submission = typeof submissions.$inferSelect;

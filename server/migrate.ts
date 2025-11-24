import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

export async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.log("[Migration] No DATABASE_URL found, skipping migrations");
    return false;
  }

  try {
    console.log("[Migration] Connecting to database...");
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const db = drizzle(connection);

    console.log("[Migration] Running migrations...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    
    await connection.end();
    console.log("[Migration] Migrations completed successfully");
    return true;
  } catch (error) {
    console.error("[Migration] Migration failed:", error);
    return false;
  }
}

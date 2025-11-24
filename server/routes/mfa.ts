import express from "express";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { authenticate } from "../middleware.js";
import { getDb } from "../db.js";
import { users } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = express.Router();

/**
 * Generate MFA setup (TOTP secret and QR code)
 * POST /api/mfa/setup
 */
router.post("/setup", authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `SF Connect (${req.user!.email})`,
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Store secret temporarily (not enabled yet)
    await db
      .update(users)
      .set({ mfaSecret: secret.base32 })
      .where(eq(users.id, userId));

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
    });
  } catch (error) {
    console.error("[MFA] Setup error:", error);
    res.status(500).json({ error: "Failed to setup MFA" });
  }
});

/**
 * Enable MFA (verify TOTP code and generate backup codes)
 * POST /api/mfa/enable
 * Body: { token: string }
 */
router.post("/enable", authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user!.id;
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Get user's MFA secret
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.mfaSecret) {
      return res.status(400).json({ error: "MFA not set up" });
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 time steps before/after
    });

    if (!verified) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Generate 10 backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    // Store backup codes (hashed)
    const bcrypt = require("bcrypt");
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10))
    );

    // Enable MFA
    await db
      .update(users)
      .set({
        mfaEnabled: true,
        // Store backup codes as JSON array
        mfaSecret: JSON.stringify({
          secret: user.mfaSecret,
          backupCodes: hashedBackupCodes,
        }),
      })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      backupCodes, // Return plain codes to user (only shown once)
    });
  } catch (error) {
    console.error("[MFA] Enable error:", error);
    res.status(500).json({ error: "Failed to enable MFA" });
  }
});

/**
 * Disable MFA
 * POST /api/mfa/disable
 * Body: { password: string }
 */
router.post("/disable", authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user!.id;
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password
    const bcrypt = require("bcrypt");
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Disable MFA
    await db
      .update(users)
      .set({
        mfaEnabled: false,
        mfaSecret: null,
      })
      .where(eq(users.id, userId));

    res.json({ success: true });
  } catch (error) {
    console.error("[MFA] Disable error:", error);
    res.status(500).json({ error: "Failed to disable MFA" });
  }
});

/**
 * Verify MFA token during login
 * POST /api/mfa/verify
 * Body: { email: string, token: string, isBackupCode?: boolean }
 */
router.post("/verify", async (req, res) => {
  try {
    const { email, token, isBackupCode } = req.body;
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return res.status(400).json({ error: "MFA not enabled" });
    }

    let verified = false;

    // Parse MFA data
    let mfaData: { secret: string; backupCodes?: string[] };
    try {
      mfaData = JSON.parse(user.mfaSecret);
    } catch {
      // Legacy format (just the secret string)
      mfaData = { secret: user.mfaSecret };
    }

    if (isBackupCode) {
      // Verify backup code
      const bcrypt = require("bcrypt");
      if (mfaData.backupCodes) {
        for (let i = 0; i < mfaData.backupCodes.length; i++) {
          const isValid = await bcrypt.compare(token, mfaData.backupCodes[i]);
          if (isValid) {
            verified = true;
            // Remove used backup code
            mfaData.backupCodes.splice(i, 1);
            await db
              .update(users)
              .set({ mfaSecret: JSON.stringify(mfaData) })
              .where(eq(users.id, user.id));
            break;
          }
        }
      }
    } else {
      // Verify TOTP token
      verified = speakeasy.totp.verify({
        secret: mfaData.secret,
        encoding: "base32",
        token,
        window: 2,
      });
    }

    if (!verified) {
      return res.status(401).json({ error: "Invalid verification code" });
    }

    // Generate JWT token
    const { generateToken } = await import("../auth.js");
    const jwtToken = await generateToken(user.id, user.email!, user.role);

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[MFA] Verify error:", error);
    res.status(500).json({ error: "Failed to verify MFA token" });
  }
});

/**
 * Check MFA status
 * GET /api/mfa/status
 */
router.get("/status", authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Count remaining backup codes
    let backupCodesRemaining = 0;
    if (user.mfaSecret) {
      try {
        const mfaData = JSON.parse(user.mfaSecret);
        backupCodesRemaining = mfaData.backupCodes?.length || 0;
      } catch {
        // Legacy format
      }
    }

    res.json({
      enabled: user.mfaEnabled || false,
      backupCodesRemaining,
    });
  } catch (error) {
    console.error("[MFA] Status error:", error);
    res.status(500).json({ error: "Failed to get MFA status" });
  }
});

export default router;

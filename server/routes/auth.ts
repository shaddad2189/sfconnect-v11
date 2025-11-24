import express, { Request, Response } from "express";
import { getUserByEmail, createUser, updateUser, logActivity } from "../db";
import { hashPassword, verifyPassword, generateToken } from "../auth";
import { authenticate } from "../middleware";

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user (admin only in production, or first user)
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    await createUser({
      email,
      passwordHash,
      name: name || null,
      role: "operator", // Default role
      emailVerified: false,
      lastSignedIn: new Date(),
    });

    const user = await getUserByEmail(email);
    if (!user) {
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    // Generate token
    const token = await generateToken(user.id, user.email, user.role);

    // Log activity
    await logActivity(user.id, "user_registered", `User registered: ${email}`, req.ip, req.headers["user-agent"]);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("[Auth] Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      res.json({
        mfaRequired: true,
        email: user.email,
      });
      return;
    }

    // Update last signed in
    await updateUser(user.id, { lastSignedIn: new Date() });

    // Generate token
    const token = await generateToken(user.id, user.email, user.role);

    // Log activity
    await logActivity(user.id, "user_login", `User logged in: ${email}`, req.ip, req.headers["user-agent"]);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("[Auth] Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post("/logout", authenticate, async (req: Request, res: Response) => {
  try {
    if (req.user) {
      await logActivity(req.user.id, "user_logout", `User logged out: ${req.user.email}`, req.ip, req.headers["user-agent"]);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("[Auth] Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
      },
    });
  } catch (error: any) {
    console.error("[Auth] Get user error:", error);
    res.status(500).json({ error: "Failed to get user info" });
  }
});

/**
 * POST /api/auth/change-password
 * Change password for current user
 */
router.post("/change-password", authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current password and new password are required" });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Get user with password hash
    const user = await getUserByEmail(req.user.email);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await updateUser(user.id, { passwordHash: newPasswordHash });

    // Log activity
    await logActivity(user.id, "password_changed", "User changed password", req.ip, req.headers["user-agent"]);

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error: any) {
    console.error("[Auth] Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;

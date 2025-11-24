import express, { Request, Response } from "express";
import { authenticate, requireAdmin } from "../middleware";
import { getAllUsers, updateUser, deleteUser, getAllSubmissions, logActivity } from "../db";
import { hashPassword } from "../auth";

const router = express.Router();

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
router.get("/users", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();

    // Remove sensitive data
    const sanitizedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      lastSignedIn: user.lastSignedIn,
      createdAt: user.createdAt,
    }));

    res.json({ users: sanitizedUsers });
  } catch (error: any) {
    console.error("[Admin] Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user (admin only)
 */
router.put("/users/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, role, emailVerified } = req.body;

    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (emailVerified !== undefined) updates.emailVerified = emailVerified;

    await updateUser(userId, updates);

    if (req.user) {
      await logActivity(
        req.user.id,
        "user_updated",
        `Admin updated user ID ${userId}`,
        req.ip,
        req.headers["user-agent"]
      );
    }

    res.json({ success: true, message: "User updated successfully" });
  } catch (error: any) {
    console.error("[Admin] Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user (admin only)
 */
router.delete("/users/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    // Prevent deleting self
    if (req.user && req.user.id === userId) {
      res.status(400).json({ error: "Cannot delete your own account" });
      return;
    }

    await deleteUser(userId);

    if (req.user) {
      await logActivity(
        req.user.id,
        "user_deleted",
        `Admin deleted user ID ${userId}`,
        req.ip,
        req.headers["user-agent"]
      );
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("[Admin] Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password (admin only)
 */
router.post("/users/:id/reset-password", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    if (!newPassword) {
      res.status(400).json({ error: "New password is required" });
      return;
    }

    const passwordHash = await hashPassword(newPassword);
    await updateUser(userId, { passwordHash });

    if (req.user) {
      await logActivity(
        req.user.id,
        "password_reset",
        `Admin reset password for user ID ${userId}`,
        req.ip,
        req.headers["user-agent"]
      );
    }

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error: any) {
    console.error("[Admin] Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

/**
 * GET /api/admin/submissions
 * Get all submissions (admin only)
 */
router.get("/submissions", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const submissions = await getAllSubmissions();
    res.json({ submissions });
  } catch (error: any) {
    console.error("[Admin] Get submissions error:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

export default router;

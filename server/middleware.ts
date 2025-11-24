import { Request, Response, NextFunction } from "express";
import { verifyToken, extractToken } from "./auth";
import { getUserById } from "./db";

/**
 * Extend Express Request to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string | null;
        role: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req.headers.authorization, req.headers.cookie);

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const payload = await verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  // Get full user details from database
  const user = await getUserById(payload.userId);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  next();
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
}

/**
 * Middleware to require operator or admin role
 */
export function requireOperator(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (req.user.role !== "admin" && req.user.role !== "operator") {
    res.status(403).json({ error: "Operator or admin access required" });
    return;
  }

  next();
}

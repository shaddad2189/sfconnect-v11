import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Manus OAuth disabled in standalone mode
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    res.status(501).json({ error: "Manus OAuth is not available in standalone mode. Use email/password authentication." });
  });
}

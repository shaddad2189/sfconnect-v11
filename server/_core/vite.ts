import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

// ESM __dirname polyfill
// In production build, esbuild banner provides __dirname globally
// In development, we need to create it from import.meta.url
declare global {
  var __dirname: string;
  var __filename: string;
}

// Determine the current directory
// Production: use global __dirname from esbuild banner
// Development: create from import.meta.url
async function getCurrentDir(): Promise<string> {
  if (typeof globalThis.__dirname !== 'undefined') {
    return globalThis.__dirname;
  }
  const { fileURLToPath } = await import("url");
  const filename = fileURLToPath(import.meta.url);
  return path.dirname(filename);
}

const currentDirPromise = getCurrentDir();

export async function setupVite(app: Express, server: Server) {
  const currentDir = await currentDirPromise;
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const htmlPath = path.resolve(currentDir, "../../client/index.html");
      let template = fs.readFileSync(htmlPath, "utf-8");
      template = await vite.transformIndexHtml(url, template);

      const nonce = nanoid();
      template = template.replace(/%VITE_NONCE%/g, nonce);

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export async function serveStatic(app: Express) {
  const currentDir = await currentDirPromise;
  
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(currentDir, "../..", "dist", "public")
      : path.resolve(currentDir, "public");
      
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  
  app.use(express.static(distPath));
  
  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

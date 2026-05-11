import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * NEW: THE PERSONAL USE BYPASS
 * This creates a valid session for you without needing an external login.
 */
export function registerGuestLogin(app: Express) {
  app.get("/api/auth/guest", async (req: Request, res: Response) => {
    try {
      const guestId = "personal-user-001";
      
      // 1. Register the local user in the database
      await db.upsertUser({
        openId: guestId,
        name: "Personal Admin",
        email: "admin@socialmind.local",
        loginMethod: "credentials",
        lastSignedIn: new Date(),
      });

      // 2. Generate the token that the dashboard is looking for
      const sessionToken = await sdk.createSessionToken(guestId, {
        name: "Personal Admin",
        expiresInMs: ONE_YEAR_MS,
      });

      // 3. Set the cookie so the browser knows you are logged in
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { 
        ...cookieOptions, 
        maxAge: ONE_YEAR_MS 
      });

      console.log("--- PERSONAL ACCESS GRANTED ---");
      // 4. Send you straight to the dashboard
      res.redirect(302, "/dashboard");
    } catch (error) {
      console.error("[Auth] Guest login failed", error);
      res.status(500).send("Failed to initiate personal session");
    }
  });
}

export function registerOAuthRoutes(app: Express) {
  // Existing OAuth logic remains for future public use
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
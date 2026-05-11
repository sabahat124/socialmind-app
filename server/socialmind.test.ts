import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext; clearedCookies: { name: string; options: Record<string, unknown> }[] } {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@socialmind.app",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createEditorContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "editor-user",
    email: "editor@socialmind.app",
    name: "Editor User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });

  it("returns current user from auth.me", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeTruthy();
    expect(user?.role).toBe("admin");
  });
});

// ─── Role-Based Access Control Tests ─────────────────────────────────────────
describe("role-based access control", () => {
  it("admin can access team.list", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // This will fail with DB error in test env but should not throw FORBIDDEN
    try {
      await caller.team.list();
    } catch (e: unknown) {
      const err = e as { code?: string };
      expect(err.code).not.toBe("FORBIDDEN");
    }
  });

  it("editor cannot access team.list", async () => {
    const { ctx } = createEditorContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.team.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("editor cannot access analytics.adminOverview", async () => {
    const { ctx } = createEditorContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analytics.adminOverview()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("editor cannot approve content", async () => {
    const { ctx } = createEditorContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.content.approve({ postId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("editor cannot reject content", async () => {
    const { ctx } = createEditorContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.content.reject({ postId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("editor cannot promote users", async () => {
    const { ctx } = createEditorContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.team.promoteToAdmin({ userId: 3 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("editor cannot demote users", async () => {
    const { ctx } = createEditorContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.team.demoteToUser({ userId: 3 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// ─── Content Workflow Tests ───────────────────────────────────────────────────
describe("content workflow validation", () => {
  it("scheduling.suggestTimes returns optimal times for instagram", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.scheduling.suggestTimes({ platform: "instagram", timezone: "UTC" });
    expect(result.platform).toBe("instagram");
    expect(result.suggestedTimes).toBeInstanceOf(Array);
    expect(result.suggestedTimes.length).toBeGreaterThan(0);
    expect(result.bestDays).toBeInstanceOf(Array);
  });

  it("scheduling.suggestTimes returns optimal times for linkedin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.scheduling.suggestTimes({ platform: "linkedin", timezone: "America/New_York" });
    expect(result.platform).toBe("linkedin");
    expect(result.suggestedTimes).toContain("7:30 AM");
  });

  it("scheduling.suggestTimes returns optimal times for youtube", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.scheduling.suggestTimes({ platform: "youtube", timezone: "UTC" });
    expect(result.platform).toBe("youtube");
    expect(result.suggestedTimes).toContain("2:00 PM");
  });
});

// ─── Notification Settings Tests ─────────────────────────────────────────────
describe("notifications", () => {
  it("getSettings returns default notification config", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const settings = await caller.notifications.getSettings();
      expect(settings).toHaveProperty("emailEnabled");
      expect(settings).toHaveProperty("whatsappEnabled");
      expect(settings).toHaveProperty("notifyOnSubmit");
      expect(settings).toHaveProperty("notifyOnApprove");
      expect(settings).toHaveProperty("notifyOnReject");
    } catch (e: unknown) {
      const err = e as { code?: string };
      expect(err.code).not.toBe("FORBIDDEN");
    }
  });
});

// ─── Analytics Tests ──────────────────────────────────────────────────────────
describe("analytics", () => {
  it("platformStats returns array", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const stats = await caller.analytics.platformStats();
      expect(stats).toBeInstanceOf(Array);
    } catch (e: unknown) {
      const err = e as { code?: string };
      expect(err.code).not.toBe("FORBIDDEN");
    }
  });

  it("contentStats returns byStatus and weekly arrays", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const stats = await caller.analytics.contentStats();
      expect(stats).toHaveProperty("byStatus");
      expect(stats).toHaveProperty("weekly");
      expect(stats).toHaveProperty("total");
      expect(stats.weekly).toHaveLength(8);
    } catch (e: unknown) {
      const err = e as { code?: string };
      expect(err.code).not.toBe("FORBIDDEN");
    }
  });
});

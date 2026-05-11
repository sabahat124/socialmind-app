import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  approvalRequests,
  contentPosts,
  notificationLogs,
  postAnalytics,
  scheduledPosts,
  socialAccounts,
  users,
  type InsertApprovalRequest,
  type InsertContentPost,
  type InsertNotificationLog,
  type InsertScheduledPost,
  type InsertSocialAccount,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod", "avatarUrl"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserProfile(
  userId: number,
  data: { name?: string; whatsappNumber?: string; notifyEmail?: boolean; notifyWhatsapp?: boolean }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Social Accounts ──────────────────────────────────────────────────────────
export async function getSocialAccountsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialAccounts).where(eq(socialAccounts.userId, userId)).orderBy(desc(socialAccounts.createdAt));
}

export async function getAllSocialAccounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialAccounts).orderBy(desc(socialAccounts.createdAt));
}

export async function upsertSocialAccount(data: InsertSocialAccount) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(socialAccounts).values(data).onDuplicateKeyUpdate({
    set: {
      accountName: data.accountName,
      accountHandle: data.accountHandle,
      avatarUrl: data.avatarUrl,
      isConnected: data.isConnected,
      followerCount: data.followerCount,
      followingCount: data.followingCount,
      postCount: data.postCount,
      pageTheme: data.pageTheme,
      pageTone: data.pageTone,
      pageNiche: data.pageNiche,
      lastSyncedAt: data.lastSyncedAt,
    },
  });
  return result;
}

export async function disconnectSocialAccount(accountId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(socialAccounts)
    .set({ isConnected: false, accessToken: null, refreshToken: null })
    .where(and(eq(socialAccounts.id, accountId), eq(socialAccounts.userId, userId)));
}

export async function updateSocialAccountTheme(
  accountId: number,
  data: { pageTheme?: string; pageTone?: string; pageNiche?: string }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(socialAccounts).set({ ...data, lastSyncedAt: new Date() }).where(eq(socialAccounts.id, accountId));
}

// ─── Content Posts ────────────────────────────────────────────────────────────
export async function createContentPost(data: InsertContentPost) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(contentPosts).values(data);
  const insertId = (result as unknown as { insertId: number }[])[0]?.insertId ?? (result as unknown as { insertId: number }).insertId;
  return insertId;
}

export async function getContentPostsByUser(userId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(contentPosts.userId, userId)];
  if (status) conditions.push(eq(contentPosts.status, status as never));
  return db.select().from(contentPosts).where(and(...conditions)).orderBy(desc(contentPosts.createdAt));
}

export async function getAllContentPosts(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(contentPosts).where(eq(contentPosts.status, status as never)).orderBy(desc(contentPosts.createdAt));
  }
  return db.select().from(contentPosts).orderBy(desc(contentPosts.createdAt));
}

export async function getContentPostById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(contentPosts).where(eq(contentPosts.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateContentPost(id: number, data: Partial<InsertContentPost>) {
  const db = await getDb();
  if (!db) return;
  await db.update(contentPosts).set(data).where(eq(contentPosts.id, id));
}

export async function deleteContentPost(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(contentPosts).where(and(eq(contentPosts.id, id), eq(contentPosts.userId, userId)));
}

// ─── Approval Requests ────────────────────────────────────────────────────────
export async function createApprovalRequest(data: InsertApprovalRequest) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(approvalRequests).values(data);
  const insertId = (result as unknown as { insertId: number }[])[0]?.insertId ?? (result as unknown as { insertId: number }).insertId;
  return insertId;
}

export async function getApprovalRequests(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(approvalRequests).where(eq(approvalRequests.status, status as never)).orderBy(desc(approvalRequests.createdAt));
  }
  return db.select().from(approvalRequests).orderBy(desc(approvalRequests.createdAt));
}

export async function getApprovalRequestByPostId(postId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(approvalRequests).where(eq(approvalRequests.postId, postId)).limit(1);
  return result[0] ?? null;
}

export async function updateApprovalRequest(
  id: number,
  data: { status: "approved" | "rejected" | "revision_requested"; adminNotes?: string; reviewedById?: number }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(approvalRequests).set({ ...data, reviewedAt: new Date() }).where(eq(approvalRequests.id, id));
}

// ─── Scheduled Posts ──────────────────────────────────────────────────────────
export async function createScheduledPost(data: InsertScheduledPost) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(scheduledPosts).values(data);
  const insertId = (result as unknown as { insertId: number }[])[0]?.insertId ?? (result as unknown as { insertId: number }).insertId;
  return insertId;
}

export async function getScheduledPostsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scheduledPosts).where(eq(scheduledPosts.userId, userId)).orderBy(scheduledPosts.scheduledAt);
}

export async function getAllScheduledPosts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scheduledPosts).orderBy(scheduledPosts.scheduledAt);
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function getAnalyticsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const userAccounts = await getSocialAccountsByUser(userId);
  const accountIds = userAccounts.map((a) => a.id);
  if (accountIds.length === 0) return [];
  return db.select().from(postAnalytics).where(sql`${postAnalytics.socialAccountId} IN (${sql.join(accountIds.map(id => sql`${id}`), sql`, `)})`).orderBy(desc(postAnalytics.recordedAt));
}

export async function getOverallAnalytics() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postAnalytics).orderBy(desc(postAnalytics.recordedAt)).limit(500);
}

export async function createPostAnalytics(data: {
  postId: number;
  socialAccountId: number;
  platform: "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "youtube";
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  engagementRate?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(postAnalytics).values(data);
}

// ─── Notification Logs ────────────────────────────────────────────────────────
export async function createNotificationLog(data: InsertNotificationLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notificationLogs).values(data);
}

export async function getNotificationLogs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notificationLogs).where(eq(notificationLogs.userId, userId)).orderBy(desc(notificationLogs.createdAt)).limit(50);
}

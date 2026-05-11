import {
  bigint,
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  whatsappNumber: varchar("whatsappNumber", { length: 32 }),
  notifyEmail: boolean("notifyEmail").default(true).notNull(),
  notifyWhatsapp: boolean("notifyWhatsapp").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Social Accounts ──────────────────────────────────────────────────────────
export const socialAccounts = mysqlTable("social_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", [
    "instagram",
    "facebook",
    "twitter",
    "linkedin",
    "tiktok",
    "youtube",
  ]).notNull(),
  accountId: varchar("accountId", { length: 128 }),
  accountName: varchar("accountName", { length: 256 }),
  accountHandle: varchar("accountHandle", { length: 128 }),
  avatarUrl: text("avatarUrl"),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  isConnected: boolean("isConnected").default(false).notNull(),
  followerCount: bigint("followerCount", { mode: "number" }).default(0),
  followingCount: bigint("followingCount", { mode: "number" }).default(0),
  postCount: bigint("postCount", { mode: "number" }).default(0),
  pageTheme: text("pageTheme"),
  pageTone: text("pageTone"),
  pageNiche: varchar("pageNiche", { length: 128 }),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = typeof socialAccounts.$inferInsert;

// ─── Content Posts ────────────────────────────────────────────────────────────
export const contentPosts = mysqlTable("content_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  socialAccountId: int("socialAccountId"),
  platform: mysqlEnum("platform", [
    "instagram",
    "facebook",
    "twitter",
    "linkedin",
    "tiktok",
    "youtube",
  ]),
  contentType: mysqlEnum("contentType", ["post", "video", "story", "reel"]).default("post").notNull(),
  status: mysqlEnum("status", [
    "draft",
    "pending_approval",
    "approved",
    "rejected",
    "scheduled",
    "published",
    "failed",
  ]).default("draft").notNull(),
  caption: text("caption"),
  hashtags: text("hashtags"),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  mediaUrls: json("mediaUrls").$type<string[]>(),
  aiPromptUsed: text("aiPromptUsed"),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  rejectionReason: text("rejectionReason"),
  editNotes: text("editNotes"),
  engagementData: json("engagementData").$type<Record<string, number>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentPost = typeof contentPosts.$inferSelect;
export type InsertContentPost = typeof contentPosts.$inferInsert;

// ─── Approval Requests ────────────────────────────────────────────────────────
export const approvalRequests = mysqlTable("approval_requests", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  requestedById: int("requestedById").notNull(),
  reviewedById: int("reviewedById"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "revision_requested"])
    .default("pending")
    .notNull(),
  adminNotes: text("adminNotes"),
  emailSent: boolean("emailSent").default(false).notNull(),
  whatsappSent: boolean("whatsappSent").default(false).notNull(),
  approvalToken: varchar("approvalToken", { length: 128 }),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = typeof approvalRequests.$inferInsert;

// ─── Scheduled Posts ──────────────────────────────────────────────────────────
export const scheduledPosts = mysqlTable("scheduled_posts", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  socialAccountId: int("socialAccountId").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  isAiSuggested: boolean("isAiSuggested").default(false).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "published", "failed", "cancelled"])
    .default("pending")
    .notNull(),
  publishedAt: timestamp("publishedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertScheduledPost = typeof scheduledPosts.$inferInsert;

// ─── Analytics ────────────────────────────────────────────────────────────────
export const postAnalytics = mysqlTable("post_analytics", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  socialAccountId: int("socialAccountId").notNull(),
  platform: mysqlEnum("platform", [
    "instagram",
    "facebook",
    "twitter",
    "linkedin",
    "tiktok",
    "youtube",
  ]).notNull(),
  impressions: bigint("impressions", { mode: "number" }).default(0),
  reach: bigint("reach", { mode: "number" }).default(0),
  likes: bigint("likes", { mode: "number" }).default(0),
  comments: bigint("comments", { mode: "number" }).default(0),
  shares: bigint("shares", { mode: "number" }).default(0),
  saves: bigint("saves", { mode: "number" }).default(0),
  clicks: bigint("clicks", { mode: "number" }).default(0),
  engagementRate: varchar("engagementRate", { length: 16 }),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostAnalytics = typeof postAnalytics.$inferSelect;
export type InsertPostAnalytics = typeof postAnalytics.$inferInsert;

// ─── Notification Logs ────────────────────────────────────────────────────────
export const notificationLogs = mysqlTable("notification_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["email", "whatsapp", "in_app"]).notNull(),
  subject: varchar("subject", { length: 256 }),
  body: text("body"),
  status: mysqlEnum("status", ["sent", "failed", "pending"]).default("pending").notNull(),
  relatedPostId: int("relatedPostId"),
  relatedApprovalId: int("relatedApprovalId"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;

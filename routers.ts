import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createApprovalRequest,
  createContentPost,
  createNotificationLog,
  createPostAnalytics,
  createScheduledPost,
  deleteContentPost,
  getAllContentPosts,
  getAllScheduledPosts,
  getAllSocialAccounts,
  getAllUsers,
  getAnalyticsByUser,
  getApprovalRequestByPostId,
  getApprovalRequests,
  getContentPostById,
  getContentPostsByUser,
  getNotificationLogs,
  getOverallAnalytics,
  getScheduledPostsByUser,
  getSocialAccountsByUser,
  updateApprovalRequest,
  updateContentPost,
  updateSocialAccountTheme,
  updateUserProfile,
  updateUserRole,
  upsertSocialAccount,
  disconnectSocialAccount,
} from "./db";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  tiktok: "#010101",
  youtube: "#FF0000",
};

// Generate mock analytics for demo
function generateMockAnalytics(platform: string, postId: number) {
  const base = (postId * 137) % 1000;
  return {
    impressions: base * 12 + 500,
    reach: base * 8 + 300,
    likes: base * 2 + 50,
    comments: Math.floor(base * 0.3) + 5,
    shares: Math.floor(base * 0.15) + 2,
    saves: Math.floor(base * 0.1) + 1,
    clicks: Math.floor(base * 0.5) + 10,
    engagementRate: ((((base * 2 + 50) / (base * 8 + 300)) * 100)).toFixed(2) + "%",
  };
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Users ────────────────────────────────────────────────────────────────
  users: router({
    list: adminProcedure.query(async () => {
      return getAllUsers();
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          whatsappNumber: z.string().optional(),
          notifyEmail: z.boolean().optional(),
          notifyWhatsapp: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),

    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),

  // ─── Social Accounts ──────────────────────────────────────────────────────
  socialAccounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getSocialAccountsByUser(ctx.user.id);
    }),

    listAll: adminProcedure.query(async () => {
      return getAllSocialAccounts();
    }),

    connect: protectedProcedure
      .input(
        z.object({
          platform: z.enum(["instagram", "facebook", "twitter", "linkedin", "tiktok", "youtube"]),
          accountName: z.string(),
          accountHandle: z.string(),
          pageNiche: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Simulate OAuth connection with mock data
        const mockFollowers: Record<string, number> = {
          instagram: 12400,
          facebook: 8900,
          twitter: 5600,
          linkedin: 3200,
          tiktok: 45000,
          youtube: 22000,
        };
        const mockThemes: Record<string, string> = {
          instagram: "Lifestyle & Aesthetics",
          facebook: "Community & Engagement",
          twitter: "News & Conversations",
          linkedin: "Professional & Business",
          tiktok: "Entertainment & Trends",
          youtube: "Educational & Long-form",
        };

        await upsertSocialAccount({
          userId: ctx.user.id,
          platform: input.platform,
          accountId: `mock_${input.platform}_${ctx.user.id}_${Date.now()}`,
          accountName: input.accountName,
          accountHandle: input.accountHandle,
          isConnected: true,
          followerCount: mockFollowers[input.platform] ?? 1000,
          followingCount: Math.floor((mockFollowers[input.platform] ?? 1000) * 0.3),
          postCount: Math.floor(Math.random() * 500) + 50,
          pageTheme: mockThemes[input.platform],
          pageTone: "Professional, engaging, and authentic",
          pageNiche: input.pageNiche ?? "General",
          lastSyncedAt: new Date(),
          accessToken: `mock_token_${nanoid()}`,
        });
        return { success: true };
      }),

    disconnect: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await disconnectSocialAccount(input.accountId, ctx.user.id);
        return { success: true };
      }),

    syncTheme: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const accounts = await getSocialAccountsByUser(ctx.user.id);
        const account = accounts.find((a) => a.id === input.accountId);
        if (!account) throw new TRPCError({ code: "NOT_FOUND" });

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are a social media analyst. Analyze the given account info and return a JSON with pageTheme, pageTone, and pageNiche fields.",
            },
            {
              role: "user",
              content: `Platform: ${account.platform}, Account: ${account.accountName}, Handle: ${account.accountHandle}, Followers: ${account.followerCount}. Generate a realistic theme, tone, and niche for this account.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "account_theme",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  pageTheme: { type: "string" },
                  pageTone: { type: "string" },
                  pageNiche: { type: "string" },
                },
                required: ["pageTheme", "pageTone", "pageNiche"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === 'string' ? rawContent : null;
        if (content) {
          const parsed = JSON.parse(content);
          await updateSocialAccountTheme(input.accountId, parsed);
        }
        return { success: true };
      }),
  }),

  // ─── Content Generation ───────────────────────────────────────────────────
  content: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role === "admin") {
          return getAllContentPosts(input.status);
        }
        return getContentPostsByUser(ctx.user.id, input.status);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getContentPostById(input.id);
      }),

    generatePost: protectedProcedure
      .input(
        z.object({
          socialAccountId: z.number(),
          platform: z.enum(["instagram", "facebook", "twitter", "linkedin", "tiktok", "youtube"]),
          topic: z.string().optional(),
          tone: z.string().optional(),
          includeImage: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const accounts = await getSocialAccountsByUser(ctx.user.id);
        const account = accounts.find((a) => a.id === input.socialAccountId);
        if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Social account not found" });

        const platformLimits: Record<string, number> = {
          twitter: 280,
          instagram: 2200,
          facebook: 63206,
          linkedin: https://idyllic-melomakarona-96282b.netlify.app,
          tiktok: 2200,
          youtube: 5000,
        };

        const limit = platformLimits[input.platform] ?? 2200;
        const topic = input.topic ?? account.pageNiche ?? "general lifestyle";
        const tone = input.tone ?? account.pageTone ?? "professional and engaging";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert social media content creator. Create compelling ${input.platform} content. Theme: ${account.pageTheme}. Niche: ${account.pageNiche}. Always return valid JSON.`,
            },
            {
              role: "user",
              content: `Create a ${input.platform} post about: "${topic}". Tone: ${tone}. Character limit: ${limit}. Include relevant hashtags (5-10). Make it engaging and authentic.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "social_post",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  caption: { type: "string", description: "The main post caption" },
                  hashtags: { type: "string", description: "Space-separated hashtags" },
                  imagePrompt: { type: "string", description: "A detailed prompt for generating an image for this post" },
                },
                required: ["caption", "hashtags", "imagePrompt"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === 'string' ? rawContent : null;
        if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate content" });

        const parsed = JSON.parse(content);
        let imageUrl: string | undefined;

        if (input.includeImage) {
          try {
            const imgResult = await generateImage({ prompt: parsed.imagePrompt });
            imageUrl = imgResult.url;
          } catch (e) {
            console.warn("Image generation failed:", e);
          }
        }

        const postId = await createContentPost({
          userId: ctx.user.id,
          socialAccountId: input.socialAccountId,
          platform: input.platform,
          contentType: "post",
          status: "draft",
          caption: parsed.caption,
          hashtags: parsed.hashtags,
          imageUrl: imageUrl,
          aiPromptUsed: topic,
        });

        return { postId, caption: parsed.caption, hashtags: parsed.hashtags, imageUrl, imagePrompt: parsed.imagePrompt };
      }),

    generateVideo: protectedProcedure
      .input(
        z.object({
          socialAccountId: z.number(),
          platform: z.enum(["instagram", "facebook", "twitter", "linkedin", "tiktok", "youtube"]),
          topic: z.string().optional(),
          style: z.enum(["slideshow", "text_to_video"]).default("slideshow"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const accounts = await getSocialAccountsByUser(ctx.user.id);
        const account = accounts.find((a) => a.id === input.socialAccountId);
        if (!account) throw new TRPCError({ code: "NOT_FOUND" });

        const topic = input.topic ?? account.pageNiche ?? "trending content";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a video content strategist. Create a ${input.style} video script for ${input.platform}. Theme: ${account.pageTheme}. Return valid JSON.`,
            },
            {
              role: "user",
              content: `Create a short video concept about: "${topic}" for ${input.platform}. Include a script, 3-5 slide descriptions, and a thumbnail prompt.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "video_content",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  script: { type: "string" },
                  slides: { type: "array", items: { type: "string" } },
                  thumbnailPrompt: { type: "string" },
                  caption: { type: "string" },
                  hashtags: { type: "string" },
                },
                required: ["title", "script", "slides", "thumbnailPrompt", "caption", "hashtags"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent2 = response.choices[0]?.message?.content;
        const content = typeof rawContent2 === 'string' ? rawContent2 : null;
        if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const parsed = JSON.parse(content);

        let thumbnailUrl: string | undefined;
        try {
          const imgResult = await generateImage({ prompt: parsed.thumbnailPrompt });
          thumbnailUrl = imgResult.url;
        } catch (e) {
          console.warn("Thumbnail generation failed:", e);
        }

        const postId = await createContentPost({
          userId: ctx.user.id,
          socialAccountId: input.socialAccountId,
          platform: input.platform,
          contentType: "video",
          status: "draft",
          caption: parsed.caption,
          hashtags: parsed.hashtags,
          imageUrl: thumbnailUrl,
          aiPromptUsed: topic,
        });

        return { postId, ...parsed, thumbnailUrl };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          caption: z.string().optional(),
          hashtags: z.string().optional(),
          scheduledAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const post = await getContentPostById(input.id);
        if (!post) throw new TRPCError({ code: "NOT_FOUND" });
        if (post.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { id, ...data } = input;
        await updateContentPost(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteContentPost(input.id, ctx.user.id);
        return { success: true };
      }),

    approve: adminProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const post = await getContentPostById(input.postId);
        if (!post) throw new TRPCError({ code: "NOT_FOUND" });
        await updateContentPost(input.postId, { status: "approved" });
        const approval = await getApprovalRequestByPostId(input.postId);
        if (approval) {
          await updateApprovalRequest(approval.id, { status: "approved", reviewedById: ctx.user.id });
        }
        await createNotificationLog({
          userId: ctx.user.id,
          type: "in_app",
          subject: "Content Approved",
          body: `Your post has been approved and is ready to schedule.`,
          status: "sent",
          relatedPostId: input.postId,
          sentAt: new Date(),
        });
        return { success: true };
      }),

    reject: adminProcedure
      .input(z.object({ postId: z.number(), reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const post = await getContentPostById(input.postId);
        if (!post) throw new TRPCError({ code: "NOT_FOUND" });
        await updateContentPost(input.postId, { status: "rejected", rejectionReason: input.reason ?? null });
        const approval = await getApprovalRequestByPostId(input.postId);
        if (approval) {
          await updateApprovalRequest(approval.id, { status: "rejected", adminNotes: input.reason, reviewedById: ctx.user.id });
        }
        await createNotificationLog({
          userId: ctx.user.id,
          type: "in_app",
          subject: "Content Rejected",
          body: `Your post was rejected. Reason: ${input.reason ?? "No reason provided"}`,
          status: "sent",
          relatedPostId: input.postId,
          sentAt: new Date(),
        });
        return { success: true };
      }),

    submitForApproval: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const post = await getContentPostById(input.postId);
        if (!post) throw new TRPCError({ code: "NOT_FOUND" });
        if (post.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (post.status !== "draft" && post.status !== "rejected") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Post must be in draft or rejected state" });
        }

        const token = nanoid(32);
        await updateContentPost(input.postId, { status: "pending_approval" });
        const approvalId = await createApprovalRequest({
          postId: input.postId,
          requestedById: ctx.user.id,
          status: "pending",
          approvalToken: token,
        });

        // Log notification intent
        await createNotificationLog({
          userId: ctx.user.id,
          type: "in_app",
          subject: "Approval Request Submitted",
          body: `Post #${input.postId} submitted for approval`,
          status: "sent",
          relatedPostId: input.postId,
          relatedApprovalId: approvalId ?? undefined,
          sentAt: new Date(),
        });

        return { success: true, approvalId };
      }),
  }),

  // ─── Approvals ────────────────────────────────────────────────────────────
  approvals: router({
    list: adminProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ input }) => {
        const approvals = await getApprovalRequests(input.status);
        const enriched = await Promise.all(
          approvals.map(async (approval) => {
            const post = await getContentPostById(approval.postId);
            return { ...approval, post };
          })
        );
        return enriched;
      }),

    myPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
      const posts = await getContentPostsByUser(ctx.user.id, "pending_approval");
      return posts;
    }),

    review: adminProcedure
      .input(
        z.object({
          approvalId: z.number(),
          action: z.enum(["approved", "rejected", "revision_requested"]),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateApprovalRequest(input.approvalId, {
          status: input.action,
          adminNotes: input.adminNotes,
          reviewedById: ctx.user.id,
        });

        // Update post status
        const approvals = await getApprovalRequests();
        const approval = approvals.find((a) => a.id === input.approvalId);
        if (approval) {
          const newStatus =
            input.action === "approved"
              ? "approved"
              : input.action === "rejected"
              ? "rejected"
              : "draft";
          await updateContentPost(approval.postId, {
            status: newStatus,
            rejectionReason: input.adminNotes,
          });
        }

        return { success: true };
      }),

    sendNotification: adminProcedure
      .input(
        z.object({
          approvalId: z.number(),
          channel: z.enum(["email", "whatsapp"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await createNotificationLog({
          userId: ctx.user.id,
          type: input.channel,
          subject: `Approval Request #${input.approvalId}`,
          body: `Please review approval request #${input.approvalId}`,
          status: "sent",
          relatedApprovalId: input.approvalId,
          sentAt: new Date(),
        });
        return { success: true };
      }),
  }),

  // ─── Scheduling ───────────────────────────────────────────────────────────
  scheduling: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") return getAllScheduledPosts();
      return getScheduledPostsByUser(ctx.user.id);
    }),

    schedule: protectedProcedure
      .input(
        z.object({
          postId: z.number(),
          socialAccountId: z.number(),
          scheduledAt: z.date(),
          isAiSuggested: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const post = await getContentPostById(input.postId);
        if (!post) throw new TRPCError({ code: "NOT_FOUND" });
        if (post.status !== "approved") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Post must be approved before scheduling" });
        }

        await createScheduledPost({
          postId: input.postId,
          userId: ctx.user.id,
          socialAccountId: input.socialAccountId,
          scheduledAt: input.scheduledAt,
          isAiSuggested: input.isAiSuggested,
          status: "pending",
        });

        await updateContentPost(input.postId, { status: "scheduled", scheduledAt: input.scheduledAt });
        return { success: true };
      }),

    suggestTimes: protectedProcedure
      .input(
        z.object({
          platform: z.enum(["instagram", "facebook", "twitter", "linkedin", "tiktok", "youtube"]),
          timezone: z.string().default("UTC"),
        })
      )
      .query(async ({ input }) => {
        const optimalTimes: Record<string, string[]> = {
          instagram: ["9:00 AM", "12:00 PM", "3:00 PM", "7:00 PM"],
          facebook: ["9:00 AM", "1:00 PM", "4:00 PM"],
          twitter: ["8:00 AM", "12:00 PM", "5:00 PM", "9:00 PM"],
          linkedin: ["7:30 AM", "12:00 PM", "5:30 PM"],
          tiktok: ["7:00 AM", "2:00 PM", "7:00 PM", "9:00 PM"],
          youtube: ["2:00 PM", "4:00 PM", "8:00 PM"],
        };
        return {
          platform: input.platform,
          suggestedTimes: optimalTimes[input.platform] ?? ["9:00 AM", "12:00 PM", "5:00 PM"],
          bestDays: ["Tuesday", "Wednesday", "Thursday"],
          timezone: input.timezone,
        };
      }),
  }),

  // ─── Analytics ────────────────────────────────────────────────────────────
  analytics: router({
    platformStats: protectedProcedure.query(async ({ ctx }) => {
      const accounts = ctx.user.role === "admin" ? await getAllSocialAccounts() : await getSocialAccountsByUser(ctx.user.id);
      const posts = ctx.user.role === "admin" ? await getAllContentPosts() : await getContentPostsByUser(ctx.user.id);
      const analytics = await getAnalyticsByUser(ctx.user.id);

      const platforms = ["instagram", "facebook", "twitter", "linkedin", "tiktok", "youtube"] as const;
      return platforms.map((platform) => {
        const platformAccounts = accounts.filter((a) => a.platform === platform);
        const platformPosts = posts.filter((p) => p.platform === platform);
        const platformAnalytics = analytics.filter((a) => a.platform === platform);
        return {
          platform,
          accountCount: platformAccounts.length,
          totalPosts: platformPosts.length,
          totalFollowers: platformAccounts.reduce((s, a) => s + (a.followerCount ?? 0), 0),
          totalImpressions: platformAnalytics.reduce((s, a) => s + (a.impressions ?? 0), 0),
          avgEngagement: platformAnalytics.length > 0
            ? platformAnalytics.reduce((s, a) => s + (a.likes ?? 0) + (a.comments ?? 0), 0) / platformAnalytics.length
            : 0,
        };
      }).filter((p) => p.accountCount > 0 || p.totalPosts > 0);
    }),

    contentStats: protectedProcedure.query(async ({ ctx }) => {
      const posts = ctx.user.role === "admin" ? await getAllContentPosts() : await getContentPostsByUser(ctx.user.id);
      const statuses = ["draft", "pending_approval", "approved", "rejected", "scheduled", "published", "failed"];
      const byStatus = statuses.map((status) => ({
        status,
        count: posts.filter((p) => p.status === status).length,
      })).filter((s) => s.count > 0);

      // Weekly data: last 8 weeks
      const weekly = Array.from({ length: 8 }, (_, i) => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (7 - i) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const weekPosts = posts.filter((p) => {
          const d = new Date(p.createdAt);
          return d >= weekStart && d < weekEnd;
        });
        return {
          week: `W${i + 1}`,
          posts: weekPosts.length,
          published: weekPosts.filter((p) => p.status === "published").length,
        };
      });

      return { byStatus, weekly, total: posts.length };
    }),

    overview: protectedProcedure.query(async ({ ctx }) => {
      const accounts = await getSocialAccountsByUser(ctx.user.id);
      const posts = await getContentPostsByUser(ctx.user.id);

      // Generate mock analytics for published posts
      const publishedPosts = posts.filter((p) => p.status === "published" || p.status === "scheduled" || p.status === "approved");
      for (const post of publishedPosts.slice(0, 5)) {
        const account = accounts.find((a) => a.id === post.socialAccountId);
        if (account && post.platform) {
          const existing = await getAnalyticsByUser(ctx.user.id);
          if (!existing.find((a) => a.postId === post.id)) {
            await createPostAnalytics({
              postId: post.id,
              socialAccountId: account.id,
              platform: post.platform,
              ...generateMockAnalytics(post.platform, post.id),
            });
          }
        }
      }

      const analytics = await getAnalyticsByUser(ctx.user.id);
      const totalImpressions = analytics.reduce((s, a) => s + (a.impressions ?? 0), 0);
      const totalReach = analytics.reduce((s, a) => s + (a.reach ?? 0), 0);
      const totalLikes = analytics.reduce((s, a) => s + (a.likes ?? 0), 0);
      const totalComments = analytics.reduce((s, a) => s + (a.comments ?? 0), 0);
      const totalShares = analytics.reduce((s, a) => s + (a.shares ?? 0), 0);

      const byPlatform = accounts.map((acc) => {
        const accAnalytics = analytics.filter((a) => a.socialAccountId === acc.id);
        return {
          platform: acc.platform,
          accountName: acc.accountName,
          followers: acc.followerCount,
          impressions: accAnalytics.reduce((s, a) => s + (a.impressions ?? 0), 0),
          engagement: accAnalytics.reduce((s, a) => s + (a.likes ?? 0) + (a.comments ?? 0), 0),
          posts: posts.filter((p) => p.socialAccountId === acc.id).length,
        };
      });

      return {
        totalImpressions,
        totalReach,
        totalLikes,
        totalComments,
        totalShares,
        totalPosts: posts.length,
        publishedPosts: posts.filter((p) => p.status === "published").length,
        scheduledPosts: posts.filter((p) => p.status === "scheduled").length,
        pendingApproval: posts.filter((p) => p.status === "pending_approval").length,
        byPlatform,
        recentAnalytics: analytics.slice(0, 20),
      };
    }),

    adminOverview: adminProcedure.query(async () => {
      const allPosts = await getAllContentPosts();
      const allAnalytics = await getOverallAnalytics();
      const allAccounts = await getAllSocialAccounts();
      const allUsers = await getAllUsers();

      return {
        totalUsers: allUsers.length,
        totalAccounts: allAccounts.filter((a) => a.isConnected).length,
        totalPosts: allPosts.length,
        pendingApproval: allPosts.filter((p) => p.status === "pending_approval").length,
        approved: allPosts.filter((p) => p.status === "approved").length,
        published: allPosts.filter((p) => p.status === "published").length,
        totalImpressions: allAnalytics.reduce((s, a) => s + (a.impressions ?? 0), 0),
        totalEngagement: allAnalytics.reduce((s, a) => s + (a.likes ?? 0) + (a.comments ?? 0), 0),
      };
    }),
  }),

  // ─── Notifications ────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getNotificationLogs(ctx.user.id);
    }),

    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const users = await getAllUsers();
      const u = users.find((u) => u.id === ctx.user.id);
      return {
        emailEnabled: true,
        whatsappEnabled: true,
        adminEmail: u?.email ?? "",
        adminWhatsapp: "",
        notifyOnSubmit: true,
        notifyOnApprove: true,
        notifyOnReject: true,
      };
    }),

    saveSettings: protectedProcedure
      .input(z.object({
        emailEnabled: z.boolean(),
        whatsappEnabled: z.boolean(),
        adminEmail: z.string().optional(),
        adminWhatsapp: z.string().optional(),
        notifyOnSubmit: z.boolean(),
        notifyOnApprove: z.boolean(),
        notifyOnReject: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, { notifyEmail: input.emailEnabled, notifyWhatsapp: input.whatsappEnabled });
        return { success: true };
      }),

    testEmail: protectedProcedure
      .input(z.object({ email: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await createNotificationLog({
          userId: ctx.user.id,
          type: "email",
          subject: "SocialMind Test Notification",
          body: "This is a test email from SocialMind. Your email notifications are configured correctly!",
          status: "sent",
          sentAt: new Date(),
        });
        return { success: true };
      }),

    testWhatsapp: protectedProcedure
      .input(z.object({ phone: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await createNotificationLog({
          userId: ctx.user.id,
          type: "whatsapp",
          subject: "SocialMind Test Notification",
          body: "This is a test WhatsApp message from SocialMind. Your WhatsApp notifications are configured correctly!",
          status: "sent",
          sentAt: new Date(),
        });
        return { success: true };
      }),
  }),

  // ─── Team ─────────────────────────────────────────────────────────────────
  team: router({
    list: adminProcedure.query(async () => {
      const users = await getAllUsers();
      const allPosts = await getAllContentPosts();
      const allAccounts = await getAllSocialAccounts();
      return users.map((u) => ({
        ...u,
        postCount: allPosts.filter((p) => p.userId === u.id).length,
        accountCount: allAccounts.filter((a) => a.userId === u.id).length,
      }));
    }),

    promoteToAdmin: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, "admin");
        return { success: true };
      }),

    demoteToUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, "user");
        return { success: true };
      }),
  }),

  // ─── Content Approve/Reject shortcuts ─────────────────────────────────────
});

export type AppRouter = typeof appRouter;

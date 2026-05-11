import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  Instagram,
  Linkedin,
  Sparkles,
  Twitter,
  Users,
  Youtube,
  Zap,
  TrendingUp,
  FileText,
  ArrowRight,
} from "lucide-react";
import { useLocation } from "wouter";

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Globe,
  twitter: Twitter,
  linkedin: Linkedin,
  tiktok: Zap,
  youtube: Youtube,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "text-pink-400",
  facebook: "text-blue-400",
  twitter: "text-sky-400",
  linkedin: "text-blue-500",
  tiktok: "text-white",
  youtube: "text-red-400",
};

const STATUS_CONFIG = {
  draft: { label: "Draft", class: "bg-muted/60 text-muted-foreground" },
  pending_approval: { label: "Pending", class: "bg-amber-500/15 text-amber-400" },
  approved: { label: "Approved", class: "bg-emerald-500/15 text-emerald-400" },
  rejected: { label: "Rejected", class: "bg-red-500/15 text-red-400" },
  scheduled: { label: "Scheduled", class: "bg-blue-500/15 text-blue-400" },
  published: { label: "Published", class: "bg-purple-500/15 text-purple-400" },
  failed: { label: "Failed", class: "bg-red-500/15 text-red-400" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = user?.role === "admin";

  const { data: accounts } = trpc.socialAccounts.list.useQuery();
  const { data: posts } = trpc.content.list.useQuery({});
  const { data: analytics } = trpc.analytics.overview.useQuery();
  const { data: adminStats } = trpc.analytics.adminOverview.useQuery(undefined, { enabled: isAdmin });

  const connectedAccounts = accounts?.filter((a) => a.isConnected) ?? [];
  const recentPosts = posts?.slice(0, 5) ?? [];
  const pendingCount = posts?.filter((p) => p.status === "pending_approval").length ?? 0;

  const stats = isAdmin
    ? [
        { label: "Total Users", value: adminStats?.totalUsers ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Connected Accounts", value: adminStats?.totalAccounts ?? 0, icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { label: "Pending Approval", value: adminStats?.pendingApproval ?? 0, icon: Bell, color: "text-amber-400", bg: "bg-amber-500/10" },
        { label: "Total Impressions", value: (adminStats?.totalImpressions ?? 0).toLocaleString(), icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10" },
      ]
    : [
        { label: "Connected Accounts", value: connectedAccounts.length, icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Total Posts", value: analytics?.totalPosts ?? 0, icon: FileText, color: "text-purple-400", bg: "bg-purple-500/10" },
        { label: "Pending Approval", value: pendingCount, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
        { label: "Total Impressions", value: (analytics?.totalImpressions ?? 0).toLocaleString(), icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
      ];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
              Welcome back, {user?.name?.split(" ")[0] ?? "there"} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAdmin ? "Here's your team's content overview" : "Here's your content overview"}
            </p>
          </div>
          <Button onClick={() => navigate("/create")} size="sm"
            style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Create Content
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="p-5 rounded-2xl border border-border/50 transition-all hover:-translate-y-0.5"
              style={{ background: "oklch(0.11 0.012 260)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: "Syne, sans-serif" }}>{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Posts */}
          <div className="lg:col-span-2 rounded-2xl border border-border/50 overflow-hidden"
            style={{ background: "oklch(0.11 0.012 260)" }}>
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Recent Content</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/queue")} className="text-xs text-muted-foreground h-7 px-2">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="divide-y divide-border/30">
              {recentPosts.length === 0 ? (
                <div className="p-8 text-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No content yet</p>
                  <Button size="sm" onClick={() => navigate("/create")} className="mt-3 text-xs"
                    style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
                    Generate your first post
                  </Button>
                </div>
              ) : (
                recentPosts.map((post) => {
                  const PlatformIcon = post.platform ? PLATFORM_ICONS[post.platform] : FileText;
                  const platformColor = post.platform ? PLATFORM_COLORS[post.platform] : "text-muted-foreground";
                  const statusConf = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG];
                  return (
                    <div key={post.id} className="p-4 flex items-start gap-3 hover:bg-muted/20 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "oklch(0.16 0.015 260)" }}>
                        <PlatformIcon className={`w-4 h-4 ${platformColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{post.caption?.slice(0, 80) ?? "No caption"}{(post.caption?.length ?? 0) > 80 ? "..." : ""}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground capitalize">{post.platform ?? "Unknown"}</span>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge className={`text-[10px] px-2 h-5 border-0 shrink-0 ${statusConf?.class ?? ""}`}>
                        {statusConf?.label ?? post.status}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Connected Accounts */}
            <div className="rounded-2xl border border-border/50 overflow-hidden"
              style={{ background: "oklch(0.11 0.012 260)" }}>
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Connected Accounts</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate("/accounts")} className="text-xs text-muted-foreground h-7 px-2">
                  Manage <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="p-3 space-y-2">
                {connectedAccounts.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-xs text-muted-foreground mb-2">No accounts connected</p>
                    <Button size="sm" onClick={() => navigate("/accounts")} variant="outline" className="text-xs h-7">
                      Connect Account
                    </Button>
                  </div>
                ) : (
                  connectedAccounts.slice(0, 5).map((acc) => {
                    const PlatformIcon = PLATFORM_ICONS[acc.platform] ?? Globe;
                    const platformColor = PLATFORM_COLORS[acc.platform] ?? "text-muted-foreground";
                    return (
                      <div key={acc.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/20 transition-colors">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "oklch(0.16 0.015 260)" }}>
                          <PlatformIcon className={`w-3.5 h-3.5 ${platformColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{acc.accountName}</p>
                          <p className="text-[10px] text-muted-foreground">{(acc.followerCount ?? 0).toLocaleString()} followers</p>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-border/50 overflow-hidden"
              style={{ background: "oklch(0.11 0.012 260)" }}>
              <div className="p-4 border-b border-border/50">
                <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Quick Actions</h2>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { icon: Sparkles, label: "Generate AI Post", path: "/create", color: "text-purple-400", bg: "bg-purple-500/10" },
                  { icon: Calendar, label: "View Calendar", path: "/calendar", color: "text-blue-400", bg: "bg-blue-500/10" },
                  { icon: BarChart3, label: "View Analytics", path: "/analytics", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  ...(isAdmin ? [{ icon: CheckCircle2, label: "Review Approvals", path: "/approvals", color: "text-amber-400", bg: "bg-amber-500/10" }] : []),
                ].map((action) => (
                  <button key={action.label} onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/20 transition-colors text-left">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${action.bg}`}>
                      <action.icon className={`w-3.5 h-3.5 ${action.color}`} />
                    </div>
                    <span className="text-xs font-medium">{action.label}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Platform Performance */}
        {(analytics?.byPlatform?.length ?? 0) > 0 && (
          <div className="rounded-2xl border border-border/50 overflow-hidden"
            style={{ background: "oklch(0.11 0.012 260)" }}>
            <div className="p-5 border-b border-border/50">
              <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Platform Performance</h2>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {analytics?.byPlatform?.map((p) => {
                const PlatformIcon = PLATFORM_ICONS[p.platform] ?? Globe;
                const platformColor = PLATFORM_COLORS[p.platform] ?? "text-muted-foreground";
                return (
                  <div key={p.platform} className="p-3 rounded-xl text-center"
                    style={{ background: "oklch(0.14 0.012 260)" }}>
                    <PlatformIcon className={`w-5 h-5 ${platformColor} mx-auto mb-2`} />
                    <div className="text-xs font-semibold capitalize mb-1">{p.platform}</div>
                    <div className="text-[10px] text-muted-foreground">{(p.followers ?? 0).toLocaleString()} followers</div>
                    <div className="text-[10px] text-muted-foreground">{p.posts} posts</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

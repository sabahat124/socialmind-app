import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  Globe,
  Instagram,
  Linkedin,
  TrendingUp,
  Twitter,
  Users,
  Youtube,
  Zap,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Globe,
  twitter: Twitter,
  linkedin: Linkedin,
  tiktok: Zap,
  youtube: Youtube,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#f472b6",
  facebook: "#60a5fa",
  twitter: "#38bdf8",
  linkedin: "#3b82f6",
  tiktok: "#ffffff",
  youtube: "#f87171",
};

const CHART_COLORS = ["oklch(0.65 0.22 280)", "oklch(0.62 0.2 240)", "oklch(0.68 0.22 340)", "oklch(0.7 0.2 160)", "oklch(0.72 0.2 60)"];

const STATUS_COLORS = {
  published: "#a78bfa",
  scheduled: "#60a5fa",
  approved: "#34d399",
  pending_approval: "#fbbf24",
  rejected: "#f87171",
  draft: "#6b7280",
};

export default function Analytics() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: overview } = trpc.analytics.overview.useQuery();
  const { data: adminOverview } = trpc.analytics.adminOverview.useQuery(undefined, { enabled: isAdmin });
  const { data: platformStats } = trpc.analytics.platformStats.useQuery();
  const { data: contentStats } = trpc.analytics.contentStats.useQuery();

  const summaryStats = isAdmin
    ? [
        { label: "Total Users", value: adminOverview?.totalUsers ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", change: "+12%" },
        { label: "Total Accounts", value: adminOverview?.totalAccounts ?? 0, icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500/10", change: "+5%" },
        { label: "Total Posts", value: adminOverview?.totalPosts ?? 0, icon: FileText, color: "text-purple-400", bg: "bg-purple-500/10", change: "+23%" },
        { label: "Total Impressions", value: (adminOverview?.totalImpressions ?? 0).toLocaleString(), icon: Eye, color: "text-orange-400", bg: "bg-orange-500/10", change: "+18%" },
      ]
    : [
        { label: "Total Posts", value: overview?.totalPosts ?? 0, icon: FileText, color: "text-purple-400", bg: "bg-purple-500/10", change: "+23%" },
        { label: "Published", value: overview?.publishedPosts ?? 0, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", change: "+15%" },
        { label: "Impressions", value: (overview?.totalImpressions ?? 0).toLocaleString(), icon: Eye, color: "text-blue-400", bg: "bg-blue-500/10", change: "+18%" },
        { label: "Engagement", value: `${overview?.totalLikes && overview?.totalImpressions ? ((overview.totalLikes / overview.totalImpressions) * 100).toFixed(1) : 0}%`, icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10", change: "+3.2%" },
      ];

  // Build chart data from platformStats
  const platformChartData = platformStats?.map((p) => ({
    name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    posts: p.totalPosts,
    impressions: p.totalImpressions,
    followers: p.totalFollowers,
    color: PLATFORM_COLORS[p.platform] ?? "#6b7280",
  })) ?? [];

  // Content status distribution
  const statusData = contentStats?.byStatus?.map((s) => ({
    name: s.status.replace("_", " "),
    value: s.count,
    color: STATUS_COLORS[s.status as keyof typeof STATUS_COLORS] ?? "#6b7280",
  })) ?? [];

  // Weekly posts trend (mock from contentStats)
  const weeklyData = contentStats?.weekly ?? [];

  const engagementMetrics = [
    { label: "Likes", value: (overview?.totalLikes ?? 0).toLocaleString(), icon: Heart, color: "text-pink-400" },
    { label: "Comments", value: (overview?.totalComments ?? 0).toLocaleString(), icon: MessageCircle, color: "text-blue-400" },
    { label: "Shares", value: (overview?.totalShares ?? 0).toLocaleString(), icon: Share2, color: "text-emerald-400" },
    { label: "Views", value: (overview?.totalImpressions ?? 0).toLocaleString(), icon: Eye, color: "text-purple-400" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl border text-xs"
          style={{ background: "oklch(0.14 0.012 260)", border: "1px solid oklch(0.22 0.015 260)" }}>
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
            <BarChart3 className="w-6 h-6 text-purple-400" />
            Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin ? "Platform-wide performance overview" : "Your content performance across all platforms"}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryStats.map((stat) => (
            <div key={stat.label} className="p-5 rounded-2xl border border-border/50"
              style={{ background: "oklch(0.11 0.012 260)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <Badge className="text-[10px] h-5 px-1.5 bg-emerald-500/15 text-emerald-400 border-0">
                  {stat.change}
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: "Syne, sans-serif" }}>{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {engagementMetrics.map((metric) => (
            <div key={metric.label} className="p-4 rounded-2xl border border-border/50 flex items-center gap-3"
              style={{ background: "oklch(0.11 0.012 260)" }}>
              <metric.icon className={`w-5 h-5 ${metric.color} shrink-0`} />
              <div>
                <div className="text-lg font-bold" style={{ fontFamily: "Syne, sans-serif" }}>{metric.value}</div>
                <div className="text-[10px] text-muted-foreground">{metric.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Posts by Platform */}
          <div className="p-5 rounded-2xl border border-border/50"
            style={{ background: "oklch(0.11 0.012 260)" }}>
            <h2 className="font-semibold text-sm mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Posts by Platform</h2>
            {platformChartData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No data yet — connect accounts and publish posts
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={platformChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "oklch(0.6 0.01 260)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.6 0.01 260)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="posts" name="Posts" radius={[4, 4, 0, 0]}>
                    {platformChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Content Status Distribution */}
          <div className="p-5 rounded-2xl border border-border/50"
            style={{ background: "oklch(0.11 0.012 260)" }}>
            <h2 className="font-semibold text-sm mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Content Status Distribution</h2>
            {statusData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No content created yet
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" paddingAngle={3}>
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {statusData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                      <span className="text-xs text-muted-foreground capitalize flex-1">{entry.name}</span>
                      <span className="text-xs font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Weekly Trend */}
          <div className="p-5 rounded-2xl border border-border/50 lg:col-span-2"
            style={{ background: "oklch(0.11 0.012 260)" }}>
            <h2 className="font-semibold text-sm mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Weekly Content Activity</h2>
            {weeklyData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No weekly data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "oklch(0.6 0.01 260)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.6 0.01 260)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="posts" name="Posts" stroke="oklch(0.65 0.22 280)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="published" name="Published" stroke="oklch(0.7 0.2 160)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Platform Cards */}
        {platformStats && platformStats.length > 0 && (
          <div>
            <h2 className="font-semibold text-sm mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Platform Breakdown</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {platformStats.map((p) => {
                const PlatformIcon = PLATFORM_ICONS[p.platform] ?? Globe;
                const platformColor = PLATFORM_COLORS[p.platform] ?? "#6b7280";
                return (
                  <div key={p.platform} className="p-5 rounded-2xl border border-border/50"
                    style={{ background: "oklch(0.11 0.012 260)" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${platformColor}20` }}>
                        <PlatformIcon className="w-5 h-5" style={{ color: platformColor }} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm capitalize">{p.platform}</div>
                        <div className="text-[10px] text-muted-foreground">{p.accountCount} account{p.accountCount !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Followers", value: (p.totalFollowers ?? 0).toLocaleString() },
                        { label: "Posts", value: p.totalPosts },
                        { label: "Impressions", value: (p.totalImpressions ?? 0).toLocaleString() },
                        { label: "Engagement", value: `${(p.avgEngagement ?? 0).toFixed(1)}%` },
                      ].map((m) => (
                        <div key={m.label} className="p-2 rounded-lg text-center"
                          style={{ background: "oklch(0.14 0.012 260)" }}>
                          <div className="text-sm font-bold">{m.value}</div>
                          <div className="text-[10px] text-muted-foreground">{m.label}</div>
                        </div>
                      ))}
                    </div>
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

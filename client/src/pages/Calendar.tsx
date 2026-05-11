import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Instagram,
  Linkedin,
  Sparkles,
  Twitter,
  Youtube,
  Zap,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useState } from "react";
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

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted/60 text-muted-foreground",
  pending_approval: "bg-amber-500/15 text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
  scheduled: "bg-blue-500/15 text-blue-400",
  published: "bg-purple-500/15 text-purple-400",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Calendar() {
  const [, navigate] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const { data: posts } = trpc.content.list.useQuery({});
  const { data: scheduled } = trpc.scheduling.list.useQuery();
  const { data: accounts } = trpc.socialAccounts.list.useQuery();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Map posts to calendar days
  const postsByDay: Record<number, typeof posts> = {};
  posts?.forEach((post) => {
    if (post.scheduledAt) {
      const d = new Date(post.scheduledAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!postsByDay[day]) postsByDay[day] = [];
        postsByDay[day]!.push(post);
      }
    }
  });

  // AI suggested times
  const { data: suggestedTimes } = trpc.scheduling.suggestTimes.useQuery(
    { platform: (selectedPlatform ?? "instagram") as never },
    { enabled: true }
  );

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  const calendarCells = [];
  // Prev month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarCells.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({ day: i, isCurrentMonth: true });
  }
  // Next month days
  const remaining = 42 - calendarCells.length;
  for (let i = 1; i <= remaining; i++) {
    calendarCells.push({ day: i, isCurrentMonth: false });
  }

  const scheduledPosts = posts?.filter((p) => p.status === "scheduled") ?? [];
  const upcomingPosts = scheduledPosts
    .filter((p) => p.scheduledAt && new Date(p.scheduledAt) >= today)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Content Calendar</h1>
            <p className="text-muted-foreground text-sm mt-1">Schedule and manage your upcoming posts</p>
          </div>
          <Button onClick={() => navigate("/create")} size="sm"
            style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Create Content
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 rounded-2xl border border-border/50 overflow-hidden"
            style={{ background: "oklch(0.11 0.012 260)" }}>
            {/* Calendar Header */}
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>
                {MONTHS[month]} {year}
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={prevMonth} className="h-8 w-8 p-0">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="h-8 px-3 text-xs">
                  Today
                </Button>
                <Button variant="ghost" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-border/30">
              {DAYS.map((day) => (
                <div key={day} className="p-2 text-center text-[11px] font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarCells.map((cell, i) => {
                const dayPosts = cell.isCurrentMonth ? (postsByDay[cell.day] ?? []) : [];
                const isCurrentDay = cell.isCurrentMonth && isToday(cell.day);
                return (
                  <div key={i}
                    className={`min-h-[80px] p-1.5 border-b border-r border-border/20 transition-colors ${cell.isCurrentMonth ? "hover:bg-muted/10" : "opacity-30"}`}>
                    <div className={`text-xs w-6 h-6 flex items-center justify-center rounded-full mb-1 font-medium ${isCurrentDay ? "text-white" : "text-muted-foreground"}`}
                      style={isCurrentDay ? { background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" } : {}}>
                      {cell.day}
                    </div>
                    <div className="space-y-0.5">
                      {dayPosts.slice(0, 2).map((post) => {
                        const PlatformIcon = post.platform ? PLATFORM_ICONS[post.platform] : CalendarIcon;
                        const platformColor = post.platform ? PLATFORM_COLORS[post.platform] : "text-muted-foreground";
                        return (
                          <div key={post.id}
                            className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] truncate"
                            style={{ background: "oklch(0.65 0.22 280 / 0.15)" }}>
                            <PlatformIcon className={`w-2.5 h-2.5 shrink-0 ${platformColor}`} />
                            <span className="truncate text-foreground/80">{post.caption?.slice(0, 15) ?? "Post"}</span>
                          </div>
                        );
                      })}
                      {dayPosts.length > 2 && (
                        <div className="text-[9px] text-muted-foreground px-1">+{dayPosts.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* AI Suggested Times */}
            <div className="rounded-2xl border border-border/50 overflow-hidden"
              style={{ background: "oklch(0.11 0.012 260)" }}>
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>AI Best Times</h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Platform</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {["instagram", "facebook", "twitter", "linkedin", "tiktok", "youtube"].map((p) => (
                      <button key={p} onClick={() => setSelectedPlatform(p)}
                        className={`px-2 py-1 rounded-lg text-[10px] border capitalize transition-all ${selectedPlatform === p ? "border-primary/50 text-primary" : "border-border/50 text-muted-foreground"}`}
                        style={{ background: selectedPlatform === p ? "oklch(0.65 0.22 280 / 0.1)" : "oklch(0.14 0.012 260)" }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {suggestedTimes && (
                  <>
                    <div>
                      <div className="text-[10px] text-muted-foreground mb-2">Optimal posting times</div>
                      <div className="space-y-1.5">
                        {suggestedTimes.suggestedTimes.map((time) => (
                          <div key={time} className="flex items-center gap-2 p-2 rounded-lg"
                            style={{ background: "oklch(0.14 0.012 260)" }}>
                            <Clock className="w-3 h-3 text-primary" />
                            <span className="text-xs font-medium">{time}</span>
                            <Badge className="ml-auto text-[9px] h-4 px-1.5 bg-emerald-500/15 text-emerald-400 border-0">Best</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground mb-1.5">Best days</div>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedTimes.bestDays.map((day) => (
                          <Badge key={day} className="text-[10px] bg-blue-500/15 text-blue-400 border-0">{day}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Upcoming Scheduled */}
            <div className="rounded-2xl border border-border/50 overflow-hidden"
              style={{ background: "oklch(0.11 0.012 260)" }}>
              <div className="p-4 border-b border-border/50">
                <h3 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Upcoming Posts</h3>
              </div>
              <div className="divide-y divide-border/30">
                {upcomingPosts.length === 0 ? (
                  <div className="p-6 text-center">
                    <CalendarIcon className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No scheduled posts</p>
                  </div>
                ) : (
                  upcomingPosts.map((post) => {
                    const PlatformIcon = post.platform ? PLATFORM_ICONS[post.platform] : CalendarIcon;
                    const platformColor = post.platform ? PLATFORM_COLORS[post.platform] : "text-muted-foreground";
                    return (
                      <div key={post.id} className="p-3 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "oklch(0.16 0.015 260)" }}>
                          <PlatformIcon className={`w-3.5 h-3.5 ${platformColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate">{post.caption?.slice(0, 40) ?? "No caption"}...</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                          </p>
                        </div>
                        <Badge className={`text-[9px] h-4 px-1.5 border-0 shrink-0 ${STATUS_COLORS[post.status] ?? ""}`}>
                          {post.status}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Scheduled", value: scheduledPosts.length, color: "text-blue-400", bg: "bg-blue-500/10" },
                { label: "This Month", value: Object.values(postsByDay).flat().length, color: "text-purple-400", bg: "bg-purple-500/10" },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-2xl border border-border/50 text-center"
                  style={{ background: "oklch(0.11 0.012 260)" }}>
                  <div className={`text-2xl font-bold mb-0.5 ${stat.color}`} style={{ fontFamily: "Syne, sans-serif" }}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}

import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Globe,
  Instagram,
  Linkedin,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  Twitter,
  Youtube,
  Zap,
  Image,
  FileText,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
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

const STATUS_CONFIG = {
  draft: { label: "Draft", class: "bg-muted/60 text-muted-foreground", icon: FileText },
  pending_approval: { label: "Pending Review", class: "bg-amber-500/15 text-amber-400", icon: Clock },
  approved: { label: "Approved", class: "bg-emerald-500/15 text-emerald-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", class: "bg-red-500/15 text-red-400", icon: XCircle },
  scheduled: { label: "Scheduled", class: "bg-blue-500/15 text-blue-400", icon: Calendar },
  published: { label: "Published", class: "bg-purple-500/15 text-purple-400", icon: CheckCircle2 },
  failed: { label: "Failed", class: "bg-red-500/15 text-red-400", icon: AlertCircle },
};

const TABS = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "pending_approval", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
  { id: "rejected", label: "Rejected" },
];

export default function ContentQueue() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [schedulePostId, setSchedulePostId] = useState<number | null>(null);
  const [scheduleAccountId, setScheduleAccountId] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [viewPost, setViewPost] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: posts, isLoading } = trpc.content.list.useQuery(
    { status: activeTab === "all" ? undefined : activeTab }
  );
  const { data: accounts } = trpc.socialAccounts.list.useQuery();
  const { data: viewedPost } = trpc.content.getById.useQuery(
    { id: viewPost! },
    { enabled: viewPost !== null }
  );

  const submitApprovalMutation = trpc.content.submitForApproval.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      toast.success("Submitted for admin approval!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.content.delete.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      toast.success("Post deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const scheduleMutation = trpc.scheduling.schedule.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      setSchedulePostId(null);
      toast.success("Post scheduled successfully!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSchedule = () => {
    if (!schedulePostId || !scheduleAccountId || !scheduleDate) {
      toast.error("Please fill in all scheduling fields");
      return;
    }
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`);
    scheduleMutation.mutate({
      postId: schedulePostId,
      socialAccountId: scheduleAccountId,
      scheduledAt,
      isAiSuggested: false,
    });
  };

  const tabCounts = {
    all: posts?.length ?? 0,
    draft: posts?.filter((p) => p.status === "draft").length ?? 0,
    pending_approval: posts?.filter((p) => p.status === "pending_approval").length ?? 0,
    approved: posts?.filter((p) => p.status === "approved").length ?? 0,
    scheduled: posts?.filter((p) => p.status === "scheduled").length ?? 0,
    published: posts?.filter((p) => p.status === "published").length ?? 0,
    rejected: posts?.filter((p) => p.status === "rejected").length ?? 0,
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Content Queue</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage all your posts across platforms</p>
          </div>
          <Button onClick={() => navigate("/create")} size="sm"
            style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Create New
          </Button>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { key: "pending_approval", label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10" },
            { key: "approved", label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { key: "scheduled", label: "Scheduled", color: "text-blue-400", bg: "bg-blue-500/10" },
            { key: "published", label: "Published", color: "text-purple-400", bg: "bg-purple-500/10" },
            { key: "rejected", label: "Rejected", color: "text-red-400", bg: "bg-red-500/10" },
            { key: "draft", label: "Drafts", color: "text-muted-foreground", bg: "bg-muted/30" },
          ].map((s) => (
            <button key={s.key} onClick={() => setActiveTab(s.key)}
              className={`p-3 rounded-xl border text-center transition-all ${activeTab === s.key ? "border-primary/30" : "border-border/50"}`}
              style={{ background: activeTab === s.key ? "oklch(0.65 0.22 280 / 0.08)" : "oklch(0.11 0.012 260)" }}>
              <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "Syne, sans-serif" }}>
                {tabCounts[s.key as keyof typeof tabCounts] ?? 0}
              </div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="border border-border/50 p-1 flex-wrap h-auto gap-1"
            style={{ background: "oklch(0.11 0.012 260)" }}>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs h-7 px-3">
                {tab.label}
                {tabCounts[tab.id as keyof typeof tabCounts] > 0 && (
                  <span className="ml-1.5 text-[10px] opacity-60">({tabCounts[tab.id as keyof typeof tabCounts]})</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !posts || posts.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border border-border/50"
                  style={{ background: "oklch(0.11 0.012 260)" }}>
                  <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No posts here</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {tab.id === "draft" ? "Generate content to see drafts" : `No ${tab.label.toLowerCase()} posts`}
                  </p>
                  {tab.id === "draft" || tab.id === "all" ? (
                    <Button size="sm" onClick={() => navigate("/create")}
                      style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Generate Content
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => {
                    const PlatformIcon = post.platform ? PLATFORM_ICONS[post.platform] : FileText;
                    const platformColor = post.platform ? PLATFORM_COLORS[post.platform] : "text-muted-foreground";
                    const statusConf = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG];
                    const StatusIcon = statusConf?.icon ?? FileText;
                    return (
                      <div key={post.id}
                        className="p-4 rounded-2xl border border-border/50 flex items-start gap-4 hover:bg-muted/5 transition-colors"
                        style={{ background: "oklch(0.11 0.012 260)" }}>
                        {/* Platform Icon */}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "oklch(0.16 0.015 260)" }}>
                          <PlatformIcon className={`w-5 h-5 ${platformColor}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Badge className={`text-[10px] px-2 h-5 border-0 flex items-center gap-1 ${statusConf?.class ?? ""}`}>
                              <StatusIcon className="w-2.5 h-2.5" />
                              {statusConf?.label ?? post.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground capitalize">{post.platform}</span>
                            <span className="text-xs text-muted-foreground capitalize">{post.contentType}</span>
                            {post.scheduledAt && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(post.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground/90 line-clamp-2 mb-1.5">
                            {post.caption ?? "No caption"}
                          </p>
                          {post.hashtags && (
                            <p className="text-xs text-primary/60 truncate">{post.hashtags.slice(0, 80)}</p>
                          )}
                          {post.rejectionReason && (
                            <div className="mt-2 p-2 rounded-lg text-xs text-red-400"
                              style={{ background: "oklch(0.55 0.22 25 / 0.1)" }}>
                              Rejected: {post.rejectionReason}
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground mt-1.5">
                            Created {new Date(post.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Image thumbnail */}
                        {post.imageUrl && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                            <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewPost(post.id)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {(post.status === "draft" || post.status === "rejected") && (
                            <Button size="sm" className="h-7 text-[10px] px-2"
                              style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}
                              onClick={() => submitApprovalMutation.mutate({ postId: post.id })}
                              disabled={submitApprovalMutation.isPending}>
                              <Send className="w-3 h-3 mr-1" />
                              Submit
                            </Button>
                          )}
                          {post.status === "approved" && (
                            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 border-blue-500/30 text-blue-400"
                              onClick={() => { setSchedulePostId(post.id); setScheduleAccountId(post.socialAccountId ?? null); }}>
                              <Calendar className="w-3 h-3 mr-1" />
                              Schedule
                            </Button>
                          )}
                          {(post.status === "draft" || post.status === "rejected") && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => deleteMutation.mutate({ id: post.id })}
                              disabled={deleteMutation.isPending}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={schedulePostId !== null} onOpenChange={(open) => !open && setSchedulePostId(null)}>
        <DialogContent style={{ background: "oklch(0.12 0.012 260)", border: "1px solid oklch(0.22 0.015 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Syne, sans-serif" }}>Schedule Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Account</label>
              <select
                value={scheduleAccountId?.toString() ?? ""}
                onChange={(e) => setScheduleAccountId(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm border border-border/50"
                style={{ background: "oklch(0.14 0.012 260)", color: "oklch(0.97 0.005 260)" }}>
                <option value="">Select account</option>
                {accounts?.filter((a) => a.isConnected).map((acc) => (
                  <option key={acc.id} value={acc.id.toString()}>
                    {acc.accountName} ({acc.platform})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Date *</label>
              <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                className="border-border/50" style={{ background: "oklch(0.14 0.012 260)" }} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Time</label>
              <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
                className="border-border/50" style={{ background: "oklch(0.14 0.012 260)" }} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSchedulePostId(null)} className="flex-1 border-border/50">Cancel</Button>
              <Button onClick={handleSchedule} disabled={scheduleMutation.isPending} className="flex-1"
                style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
                {scheduleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule Post"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Post Dialog */}
      <Dialog open={viewPost !== null} onOpenChange={(open) => !open && setViewPost(null)}>
        <DialogContent className="max-w-lg" style={{ background: "oklch(0.12 0.012 260)", border: "1px solid oklch(0.22 0.015 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Syne, sans-serif" }}>Post Details</DialogTitle>
          </DialogHeader>
          {viewedPost && (
            <div className="space-y-4">
              {viewedPost.imageUrl && (
                <img src={viewedPost.imageUrl} alt="" className="w-full rounded-xl object-cover max-h-64" />
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Caption</div>
                <p className="text-sm">{viewedPost.caption}</p>
              </div>
              {viewedPost.hashtags && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Hashtags</div>
                  <p className="text-xs text-primary/70">{viewedPost.hashtags}</p>
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <Badge className="capitalize text-xs">{viewedPost.platform}</Badge>
                <Badge className="capitalize text-xs">{viewedPost.contentType}</Badge>
                <Badge className={`text-xs border-0 ${STATUS_CONFIG[viewedPost.status as keyof typeof STATUS_CONFIG]?.class ?? ""}`}>
                  {STATUS_CONFIG[viewedPost.status as keyof typeof STATUS_CONFIG]?.label ?? viewedPost.status}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

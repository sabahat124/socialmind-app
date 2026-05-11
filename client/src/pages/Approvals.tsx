import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Bell,
  CheckCircle2,
  Clock,
  Globe,
  Instagram,
  Linkedin,
  Loader2,
  MessageSquare,
  Shield,
  Twitter,
  XCircle,
  Youtube,
  Zap,
  Eye,
  FileText,
  Image,
  Send,
  Users,
} from "lucide-react";
import { useState } from "react";

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

export default function Approvals() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [rejectPostId, setRejectPostId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [viewPost, setViewPost] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: pendingPosts, isLoading } = trpc.content.list.useQuery({ status: "pending_approval" });
  const { data: viewedPost } = trpc.content.getById.useQuery(
    { id: viewPost! },
    { enabled: viewPost !== null }
  );
  const { data: notifications } = trpc.notifications.list.useQuery();

  const approveMutation = trpc.content.approve.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      toast.success("Post approved! Notification sent to editor.");
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = trpc.content.reject.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      setRejectPostId(null);
      setRejectionReason("");
      toast.success("Post rejected with feedback sent to editor.");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleApprove = (postId: number) => {
    approveMutation.mutate({ postId });
  };

  const handleReject = () => {
    if (!rejectPostId) return;
    rejectMutation.mutate({ postId: rejectPostId, reason: rejectionReason });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
              <Bell className="w-6 h-6 text-amber-400" />
              {isAdmin ? "Approval Center" : "My Submissions"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAdmin
                ? "Review and approve content before it goes live"
                : "Track the status of your submitted content"}
            </p>
          </div>
          {isAdmin && (
            <Badge className="bg-amber-500/15 text-amber-400 border-0 px-3 py-1.5 text-sm">
              {pendingPosts?.length ?? 0} Pending
            </Badge>
          )}
        </div>

        {/* Admin Role Notice */}
        {!isAdmin && (
          <div className="p-4 rounded-2xl border border-border/50 flex items-start gap-3"
            style={{ background: "oklch(0.65 0.22 280 / 0.06)", borderColor: "oklch(0.65 0.22 280 / 0.2)" }}>
            <Shield className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium mb-0.5">Editor View</div>
              <div className="text-xs text-muted-foreground">
                You can view the status of your submitted content here. Only admins can approve or reject posts.
                Admins are notified via email and WhatsApp when you submit content.
              </div>
            </div>
          </div>
        )}

        {/* Pending Posts */}
        <div className="rounded-2xl border border-border/50 overflow-hidden"
          style={{ background: "oklch(0.11 0.012 260)" }}>
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
              {isAdmin ? "Awaiting Your Review" : "Pending Approval"}
            </h2>
            {isAdmin && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bell className="w-3.5 h-3.5" />
                Admins notified via email & WhatsApp
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !pendingPosts || pendingPosts.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400/30 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">All clear!</h3>
              <p className="text-sm text-muted-foreground">No posts pending approval</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {pendingPosts.map((post) => {
                const PlatformIcon = post.platform ? PLATFORM_ICONS[post.platform] : FileText;
                const platformColor = post.platform ? PLATFORM_COLORS[post.platform] : "text-muted-foreground";
                return (
                  <div key={post.id} className="p-5 flex items-start gap-4 hover:bg-muted/5 transition-colors">
                    {/* Platform */}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "oklch(0.16 0.015 260)" }}>
                      <PlatformIcon className={`w-5 h-5 ${platformColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className="text-[10px] px-2 h-5 border-0 bg-amber-500/15 text-amber-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> Pending Review
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">{post.platform}</span>
                        <span className="text-xs text-muted-foreground capitalize">{post.contentType}</span>
                        <span className="text-xs text-muted-foreground">
                          Submitted {new Date(post.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-sm text-foreground/90 line-clamp-3 mb-2">
                        {post.caption ?? "No caption"}
                      </p>

                      {post.hashtags && (
                        <p className="text-xs text-primary/60 truncate mb-2">{post.hashtags.slice(0, 100)}</p>
                      )}

                      {/* Submitter info */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>Submitted by user #{post.userId}</span>
                      </div>
                    </div>

                    {/* Image */}
                    {post.imageUrl && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                        <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewPost(post.id)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button size="sm" className="h-8 text-xs px-3 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0"
                            onClick={() => handleApprove(post.id)}
                            disabled={approveMutation.isPending}>
                            {approveMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <><CheckCircle2 className="w-3 h-3 mr-1" /> Approve</>
                            )}
                          </Button>
                          <Button size="sm" className="h-8 text-xs px-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0"
                            onClick={() => setRejectPostId(post.id)}>
                            <XCircle className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notification Log */}
        {isAdmin && notifications && notifications.length > 0 && (
          <div className="rounded-2xl border border-border/50 overflow-hidden"
            style={{ background: "oklch(0.11 0.012 260)" }}>
            <div className="p-5 border-b border-border/50">
              <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Notification History</h2>
            </div>
            <div className="divide-y divide-border/30">
              {notifications.slice(0, 10).map((notif) => (
                <div key={notif.id} className="p-4 flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${notif.type === "email" ? "bg-blue-500/10" : "bg-emerald-500/10"}`}>
                    {notif.type === "email" ? (
                      <Send className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium capitalize">{notif.type}</span>
                      <Badge className={`text-[10px] h-4 px-1.5 border-0 ${notif.status === "sent" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                        {notif.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{notif.body ?? notif.subject}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(notif.sentAt ?? notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectPostId !== null} onOpenChange={(open) => !open && setRejectPostId(null)}>
        <DialogContent style={{ background: "oklch(0.12 0.012 260)", border: "1px solid oklch(0.22 0.015 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Syne, sans-serif" }}>Reject Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-xl text-xs text-muted-foreground"
              style={{ background: "oklch(0.55 0.22 25 / 0.08)", border: "1px solid oklch(0.55 0.22 25 / 0.2)" }}>
              The editor will be notified of the rejection with your feedback.
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Reason for rejection (optional)</label>
              <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Caption needs to be more engaging, image doesn't match brand guidelines..."
                className="border-border/50 resize-none min-h-[100px] text-sm"
                style={{ background: "oklch(0.14 0.012 260)" }} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setRejectPostId(null)} className="flex-1 border-border/50">Cancel</Button>
              <Button onClick={handleReject} disabled={rejectMutation.isPending}
                className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0">
                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject Post"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Post Dialog */}
      <Dialog open={viewPost !== null} onOpenChange={(open) => !open && setViewPost(null)}>
        <DialogContent className="max-w-lg" style={{ background: "oklch(0.12 0.012 260)", border: "1px solid oklch(0.22 0.015 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Syne, sans-serif" }}>Post Preview</DialogTitle>
          </DialogHeader>
          {viewedPost && (
            <div className="space-y-4">
              {viewedPost.imageUrl && (
                <img src={viewedPost.imageUrl} alt="" className="w-full rounded-xl object-cover max-h-64" />
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Caption</div>
                <p className="text-sm leading-relaxed">{viewedPost.caption}</p>
              </div>
              {viewedPost.hashtags && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Hashtags</div>
                  <p className="text-xs text-primary/70">{viewedPost.hashtags}</p>
                </div>
              )}
              {viewedPost.aiPromptUsed && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">AI Prompt Used</div>
                  <p className="text-xs text-muted-foreground p-3 rounded-lg"
                    style={{ background: "oklch(0.14 0.012 260)" }}>{viewedPost.aiPromptUsed}</p>
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <Badge className="capitalize text-xs">{viewedPost.platform}</Badge>
                <Badge className="capitalize text-xs">{viewedPost.contentType}</Badge>
              </div>
              {isAdmin && viewedPost.status === "pending_approval" && (
                <div className="flex gap-3">
                  <Button className="flex-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0"
                    onClick={() => { handleApprove(viewedPost.id); setViewPost(null); }}>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                  </Button>
                  <Button className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0"
                    onClick={() => { setRejectPostId(viewedPost.id); setViewPost(null); }}>
                    <XCircle className="w-4 h-4 mr-1.5" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

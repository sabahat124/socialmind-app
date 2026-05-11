import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Globe,
  Instagram,
  Linkedin,
  Link2,
  Link2Off,
  Loader2,
  Plus,
  RefreshCw,
  Twitter,
  Users,
  Youtube,
  Zap,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useState } from "react";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-400", bg: "bg-pink-500/10", description: "Photos, Reels & Stories" },
  { id: "facebook", name: "Facebook", icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10", description: "Posts, Pages & Groups" },
  { id: "twitter", name: "X (Twitter)", icon: Twitter, color: "text-sky-400", bg: "bg-sky-500/10", description: "Tweets & Threads" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-500", bg: "bg-blue-600/10", description: "Professional Content" },
  { id: "tiktok", name: "TikTok", icon: Zap, color: "text-white", bg: "bg-white/10", description: "Short Videos & Trends" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-400", bg: "bg-red-500/10", description: "Videos & Shorts" },
];

export default function SocialAccounts() {
  const [connectOpen, setConnectOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountHandle, setAccountHandle] = useState("");
  const [pageNiche, setPageNiche] = useState("");

  const utils = trpc.useUtils();
  const { data: accounts, isLoading } = trpc.socialAccounts.list.useQuery();

  const connectMutation = trpc.socialAccounts.connect.useMutation({
    onSuccess: () => {
      utils.socialAccounts.list.invalidate();
      setConnectOpen(false);
      setSelectedPlatform("");
      setAccountName("");
      setAccountHandle("");
      setPageNiche("");
      toast.success("Account connected successfully!");
    },
    onError: (e) => toast.error(e.message),
  });

  const disconnectMutation = trpc.socialAccounts.disconnect.useMutation({
    onSuccess: () => {
      utils.socialAccounts.list.invalidate();
      toast.success("Account disconnected");
    },
    onError: (e) => toast.error(e.message),
  });

  const syncMutation = trpc.socialAccounts.syncTheme.useMutation({
    onSuccess: () => {
      utils.socialAccounts.list.invalidate();
      toast.success("Theme synced with AI analysis!");
    },
    onError: (e) => toast.error(e.message),
  });

  const connectedAccounts = accounts?.filter((a) => a.isConnected) ?? [];
  const platformsConnected = new Set(connectedAccounts.map((a) => a.platform));

  const handleConnect = () => {
    if (!selectedPlatform || !accountName || !accountHandle) {
      toast.error("Please fill in all required fields");
      return;
    }
    connectMutation.mutate({
      platform: selectedPlatform as never,
      accountName,
      accountHandle,
      pageNiche: pageNiche || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Social Accounts</h1>
            <p className="text-muted-foreground text-sm mt-1">Connect and manage your social media profiles</p>
          </div>
          <Button onClick={() => setConnectOpen(true)} size="sm"
            style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Connect Account
          </Button>
        </div>

        {/* Platform Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PLATFORMS.map((platform) => {
            const isConnected = platformsConnected.has(platform.id as never);
            return (
              <div key={platform.id}
                className={`p-4 rounded-2xl border transition-all cursor-default ${isConnected ? "border-primary/30" : "border-border/50"}`}
                style={{ background: isConnected ? "oklch(0.65 0.22 280 / 0.08)" : "oklch(0.11 0.012 260)" }}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${platform.bg}`}>
                  <platform.icon className={`w-4 h-4 ${platform.color}`} />
                </div>
                <div className="text-xs font-semibold mb-0.5">{platform.name}</div>
                <div className="text-[10px] text-muted-foreground mb-2">{platform.description}</div>
                {isConnected ? (
                  <Badge className="text-[10px] px-1.5 h-4 bg-emerald-500/15 text-emerald-400 border-0">Connected</Badge>
                ) : (
                  <Badge className="text-[10px] px-1.5 h-4 bg-muted/60 text-muted-foreground border-0">Not connected</Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Connected Accounts List */}
        <div className="rounded-2xl border border-border/50 overflow-hidden"
          style={{ background: "oklch(0.11 0.012 260)" }}>
          <div className="p-5 border-b border-border/50">
            <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
              Connected Accounts ({connectedAccounts.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : connectedAccounts.length === 0 ? (
            <div className="py-16 text-center">
              <Link2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No accounts connected</h3>
              <p className="text-sm text-muted-foreground mb-4">Connect your social media profiles to start generating content</p>
              <Button onClick={() => setConnectOpen(true)} size="sm"
                style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Connect First Account
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {connectedAccounts.map((account) => {
                const platform = PLATFORMS.find((p) => p.id === account.platform);
                const PlatformIcon = platform?.icon ?? Globe;
                return (
                  <div key={account.id} className="p-5 flex items-start gap-4 hover:bg-muted/10 transition-colors">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${platform?.bg ?? "bg-muted"}`}>
                      <PlatformIcon className={`w-5 h-5 ${platform?.color ?? "text-muted-foreground"}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{account.accountName}</span>
                        <Badge className="text-[10px] px-1.5 h-4 bg-emerald-500/15 text-emerald-400 border-0">Live</Badge>
                        <span className="text-xs text-muted-foreground capitalize">{account.platform}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">@{account.accountHandle}</div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center p-2 rounded-lg" style={{ background: "oklch(0.14 0.012 260)" }}>
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Users className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <div className="text-xs font-semibold">{(account.followerCount ?? 0).toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground">Followers</div>
                        </div>
                        <div className="text-center p-2 rounded-lg" style={{ background: "oklch(0.14 0.012 260)" }}>
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <div className="text-xs font-semibold">{(account.postCount ?? 0).toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground">Posts</div>
                        </div>
                        <div className="text-center p-2 rounded-lg" style={{ background: "oklch(0.14 0.012 260)" }}>
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <TrendingUp className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <div className="text-xs font-semibold">{(account.followingCount ?? 0).toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground">Following</div>
                        </div>
                      </div>

                      {account.pageTheme && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground">
                            {account.pageTheme}
                          </span>
                          {account.pageNiche && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground">
                              {account.pageNiche}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="h-8 text-xs border-border/50"
                        onClick={() => syncMutation.mutate({ accountId: account.id })}
                        disabled={syncMutation.isPending}>
                        {syncMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3 mr-1" />
                        )}
                        Sync Theme
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => disconnectMutation.mutate({ accountId: account.id })}
                        disabled={disconnectMutation.isPending}>
                        <Link2Off className="w-3 h-3 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Connect Dialog */}
      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent style={{ background: "oklch(0.12 0.012 260)", border: "1px solid oklch(0.22 0.015 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Syne, sans-serif" }}>Connect Social Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Platform *</Label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="border-border/50" style={{ background: "oklch(0.14 0.012 260)" }}>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent style={{ background: "oklch(0.12 0.012 260)", border: "1px solid oklch(0.22 0.015 260)" }}>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <p.icon className={`w-4 h-4 ${p.color}`} />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Account / Page Name *</Label>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. My Brand Page"
                className="border-border/50" style={{ background: "oklch(0.14 0.012 260)" }} />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Handle / Username *</Label>
              <Input value={accountHandle} onChange={(e) => setAccountHandle(e.target.value)}
                placeholder="e.g. mybrand (without @)"
                className="border-border/50" style={{ background: "oklch(0.14 0.012 260)" }} />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Page Niche (optional)</Label>
              <Input value={pageNiche} onChange={(e) => setPageNiche(e.target.value)}
                placeholder="e.g. Fashion, Tech, Food, Fitness..."
                className="border-border/50" style={{ background: "oklch(0.14 0.012 260)" }} />
            </div>

            <div className="p-3 rounded-xl text-xs text-muted-foreground"
              style={{ background: "oklch(0.65 0.22 280 / 0.08)", border: "1px solid oklch(0.65 0.22 280 / 0.2)" }}>
              <strong className="text-foreground">Demo Mode:</strong> This simulates an OAuth connection. In production, clicking "Connect" would redirect you to the platform's authorization page.
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setConnectOpen(false)} className="flex-1 border-border/50">
                Cancel
              </Button>
              <Button onClick={handleConnect} disabled={connectMutation.isPending} className="flex-1"
                style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
                {connectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect Account"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

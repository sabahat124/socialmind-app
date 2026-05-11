import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Shield,
  Users,
  Clock,
  CheckCircle2,
  FileText,
  Loader2,
  Crown,
  UserCheck,
} from "lucide-react";

export default function Team() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const { data: teamMembers, isLoading } = trpc.team.list.useQuery();

  const promoteToAdminMutation = trpc.team.promoteToAdmin.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      toast.success("User promoted to admin");
    },
    onError: (e) => toast.error(e.message),
  });

  const demoteToUserMutation = trpc.team.demoteToUser.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      toast.success("User demoted to editor");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "oklch(0.65 0.22 280 / 0.1)" }}>
              <Shield className="w-8 h-8 text-purple-400/50" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Admin Access Required</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Team management is only available to administrators. Contact your admin to manage team members.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
              <Users className="w-6 h-6 text-blue-400" />
              Team Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Manage team members and their roles</p>
          </div>
          <Badge className="bg-blue-500/15 text-blue-400 border-0 px-3 py-1.5 text-sm">
            {teamMembers?.length ?? 0} Members
          </Badge>
        </div>

        {/* Role Legend */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-border/50"
            style={{ background: "oklch(0.11 0.012 260)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold">Admin</span>
              <Badge className="ml-auto text-[10px] bg-purple-500/15 text-purple-400 border-0">Full Access</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Can approve/reject posts, manage team, view all analytics, and configure notifications.</p>
          </div>
          <div className="p-4 rounded-2xl border border-border/50"
            style={{ background: "oklch(0.11 0.012 260)" }}>
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold">Editor</span>
              <Badge className="ml-auto text-[10px] bg-blue-500/15 text-blue-400 border-0">Limited</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Can generate content, connect accounts, and submit posts for admin approval.</p>
          </div>
        </div>

        {/* Team Members List */}
        <div className="rounded-2xl border border-border/50 overflow-hidden"
          style={{ background: "oklch(0.11 0.012 260)" }}>
          <div className="p-5 border-b border-border/50">
            <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>All Members</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !teamMembers || teamMembers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No team members yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {teamMembers.map((member) => (
                <div key={member.id} className="p-5 flex items-center gap-4 hover:bg-muted/5 transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                    style={{
                      background: member.role === "admin"
                        ? "linear-gradient(135deg, oklch(0.65 0.22 280 / 0.3), oklch(0.62 0.2 240 / 0.3))"
                        : "oklch(0.16 0.015 260)",
                      color: member.role === "admin" ? "oklch(0.8 0.15 280)" : "oklch(0.7 0.01 260)",
                    }}>
                    {member.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium">{member.name ?? "Unknown"}</span>
                      {member.id === user?.id && (
                        <Badge className="text-[10px] h-4 px-1.5 bg-muted/60 text-muted-foreground border-0">You</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{member.email ?? "No email"}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      Joined {new Date(member.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4 text-center">
                    <div>
                      <div className="text-sm font-semibold">{member.postCount ?? 0}</div>
                      <div className="text-[10px] text-muted-foreground">Posts</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{member.accountCount ?? 0}</div>
                      <div className="text-[10px] text-muted-foreground">Accounts</div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <Badge className={`shrink-0 ${member.role === "admin" ? "bg-purple-500/15 text-purple-400" : "bg-blue-500/15 text-blue-400"} border-0`}>
                    {member.role === "admin" ? (
                      <><Crown className="w-3 h-3 mr-1" /> Admin</>
                    ) : (
                      <><UserCheck className="w-3 h-3 mr-1" /> Editor</>
                    )}
                  </Badge>

                  {/* Actions */}
                  {member.id !== user?.id && (
                    <div className="shrink-0">
                      {member.role === "user" ? (
                        <Button size="sm" variant="outline" className="h-8 text-xs border-border/50"
                          onClick={() => promoteToAdminMutation.mutate({ userId: member.id })}
                          disabled={promoteToAdminMutation.isPending}>
                          <Shield className="w-3 h-3 mr-1" />
                          Make Admin
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 text-xs border-border/50 text-muted-foreground"
                          onClick={() => demoteToUserMutation.mutate({ userId: member.id })}
                          disabled={demoteToUserMutation.isPending}>
                          <UserCheck className="w-3 h-3 mr-1" />
                          Make Editor
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

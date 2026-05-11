import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  MessageSquare,
  Settings as SettingsIcon,
  Shield,
  User,
  Loader2,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const utils = trpc.useUtils();
  const { data: notifSettings } = trpc.notifications.getSettings.useQuery();

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminWhatsapp, setAdminWhatsapp] = useState("");
  const [notifyOnSubmit, setNotifyOnSubmit] = useState(true);
  const [notifyOnApprove, setNotifyOnApprove] = useState(true);
  const [notifyOnReject, setNotifyOnReject] = useState(true);

  useEffect(() => {
    if (notifSettings) {
      setEmailEnabled(notifSettings.emailEnabled ?? true);
      setWhatsappEnabled(notifSettings.whatsappEnabled ?? true);
      setAdminEmail(notifSettings.adminEmail ?? user?.email ?? "");
      setAdminWhatsapp(notifSettings.adminWhatsapp ?? "");
      setNotifyOnSubmit(notifSettings.notifyOnSubmit ?? true);
      setNotifyOnApprove(notifSettings.notifyOnApprove ?? true);
      setNotifyOnReject(notifSettings.notifyOnReject ?? true);
    }
  }, [notifSettings, user]);

  const saveNotifMutation = trpc.notifications.saveSettings.useMutation({
    onSuccess: () => {
      utils.notifications.getSettings.invalidate();
      toast.success("Notification settings saved!");
    },
    onError: (e) => toast.error(e.message),
  });

  const testEmailMutation = trpc.notifications.testEmail.useMutation({
    onSuccess: () => toast.success("Test email sent!"),
    onError: (e) => toast.error(e.message),
  });

  const testWhatsappMutation = trpc.notifications.testWhatsapp.useMutation({
    onSuccess: () => toast.success("Test WhatsApp message sent!"),
    onError: (e) => toast.error(e.message),
  });

  const handleSaveNotifications = () => {
    saveNotifMutation.mutate({
      emailEnabled,
      whatsappEnabled,
      adminEmail,
      adminWhatsapp,
      notifyOnSubmit,
      notifyOnApprove,
      notifyOnReject,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
            <SettingsIcon className="w-6 h-6 text-muted-foreground" />
            Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your workspace and notification preferences</p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="border border-border/50 p-1" style={{ background: "oklch(0.11 0.012 260)" }}>
            <TabsTrigger value="profile" className="text-xs gap-1.5">
              <User className="w-3.5 h-3.5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs gap-1.5">
              <Bell className="w-3.5 h-3.5" /> Notifications
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="approval" className="text-xs gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Approval Workflow
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <div className="p-6 rounded-2xl border border-border/50 space-y-5"
              style={{ background: "oklch(0.11 0.012 260)" }}>
              <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Profile Information</h2>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.65 0.22 280 / 0.3), oklch(0.62 0.2 240 / 0.3))",
                    color: "oklch(0.8 0.15 280)",
                  }}>
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </div>
                <div>
                  <div className="font-semibold">{user?.name ?? "User"}</div>
                  <div className="text-sm text-muted-foreground">{user?.email ?? "No email"}</div>
                  <Badge className={`mt-1 text-xs ${user?.role === "admin" ? "bg-purple-500/15 text-purple-400" : "bg-blue-500/15 text-blue-400"} border-0`}>
                    {user?.role === "admin" ? "Admin" : "Editor"}
                  </Badge>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Full Name</Label>
                  <Input defaultValue={user?.name ?? ""} readOnly
                    className="border-border/50" style={{ background: "oklch(0.14 0.012 260)" }} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
                  <Input defaultValue={user?.email ?? ""} readOnly
                    className="border-border/50" style={{ background: "oklch(0.14 0.012 260)" }} />
                </div>
              </div>

              <div className="p-3 rounded-xl text-xs text-muted-foreground"
                style={{ background: "oklch(0.14 0.012 260)" }}>
                Profile information is managed through your Manus account. To update your name or email, visit your account settings.
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6 space-y-5">
            {/* Email Notifications */}
            <div className="p-6 rounded-2xl border border-border/50 space-y-5"
              style={{ background: "oklch(0.11 0.012 260)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Email Notifications</h2>
                </div>
                <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
              </div>

              {emailEnabled && (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Admin Email Address</Label>
                    <div className="flex gap-2">
                      <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@company.com" type="email"
                        className="border-border/50 flex-1" style={{ background: "oklch(0.14 0.012 260)" }} />
                      <Button variant="outline" size="sm" className="border-border/50 shrink-0"
                        onClick={() => testEmailMutation.mutate({ email: adminEmail })}
                        disabled={testEmailMutation.isPending || !adminEmail}>
                        {testEmailMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Test"}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl text-xs"
                    style={{ background: "oklch(0.62 0.2 240 / 0.08)", border: "1px solid oklch(0.62 0.2 240 / 0.2)" }}>
                    <div className="font-medium text-foreground mb-1">Email approval flow:</div>
                    <div className="text-muted-foreground">When an editor submits content for approval, an email is sent to this address with Approve / Reject links. No login required to take action.</div>
                  </div>
                </>
              )}
            </div>

            {/* WhatsApp Notifications */}
            <div className="p-6 rounded-2xl border border-border/50 space-y-5"
              style={{ background: "oklch(0.11 0.012 260)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>WhatsApp Notifications</h2>
                  <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-0">via Twilio</Badge>
                </div>
                <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
              </div>

              {whatsappEnabled && (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Admin WhatsApp Number</Label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 px-3 rounded-lg border border-border/50 shrink-0"
                        style={{ background: "oklch(0.14 0.012 260)" }}>
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">+</span>
                      </div>
                      <Input value={adminWhatsapp} onChange={(e) => setAdminWhatsapp(e.target.value)}
                        placeholder="1234567890 (with country code)"
                        className="border-border/50 flex-1" style={{ background: "oklch(0.14 0.012 260)" }} />
                      <Button variant="outline" size="sm" className="border-border/50 shrink-0"
                        onClick={() => testWhatsappMutation.mutate({ phone: adminWhatsapp })}
                        disabled={testWhatsappMutation.isPending || !adminWhatsapp}>
                        {testWhatsappMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Test"}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl text-xs"
                    style={{ background: "oklch(0.7 0.2 160 / 0.08)", border: "1px solid oklch(0.7 0.2 160 / 0.2)" }}>
                    <div className="font-medium text-foreground mb-1">WhatsApp approval flow:</div>
                    <div className="text-muted-foreground">Approval requests are sent as WhatsApp messages. Reply with "APPROVE" or "REJECT [reason]" to take action directly from WhatsApp. Requires Twilio WhatsApp API credentials.</div>
                  </div>
                </>
              )}
            </div>

            {/* Notification Triggers */}
            <div className="p-6 rounded-2xl border border-border/50 space-y-4"
              style={{ background: "oklch(0.11 0.012 260)" }}>
              <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Notification Triggers</h2>
              {[
                { key: "submit", label: "New content submitted for approval", desc: "Notify admin when an editor submits content", value: notifyOnSubmit, setter: setNotifyOnSubmit },
                { key: "approve", label: "Content approved", desc: "Notify editor when their content is approved", value: notifyOnApprove, setter: setNotifyOnApprove },
                { key: "reject", label: "Content rejected", desc: "Notify editor when their content is rejected", value: notifyOnReject, setter: setNotifyOnReject },
              ].map((trigger) => (
                <div key={trigger.key} className="flex items-start justify-between gap-4 p-3 rounded-xl"
                  style={{ background: "oklch(0.14 0.012 260)" }}>
                  <div>
                    <div className="text-sm font-medium">{trigger.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{trigger.desc}</div>
                  </div>
                  <Switch checked={trigger.value} onCheckedChange={trigger.setter} />
                </div>
              ))}
            </div>

            <Button onClick={handleSaveNotifications} disabled={saveNotifMutation.isPending}
              style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
              {saveNotifMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Save Notification Settings
            </Button>
          </TabsContent>

          {/* Approval Workflow Tab */}
          {isAdmin && (
            <TabsContent value="approval" className="mt-6">
              <div className="p-6 rounded-2xl border border-border/50 space-y-5"
                style={{ background: "oklch(0.11 0.012 260)" }}>
                <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Approval Workflow Configuration</h2>

                <div className="space-y-3">
                  {[
                    {
                      title: "Mandatory Approval",
                      desc: "All content must be approved before publishing. This cannot be disabled.",
                      enabled: true,
                      locked: true,
                    },
                    {
                      title: "Dual Notification",
                      desc: "Send approval requests via both email and WhatsApp simultaneously.",
                      enabled: emailEnabled && whatsappEnabled,
                      locked: false,
                    },
                    {
                      title: "Auto-reject on Timeout",
                      desc: "Automatically reject posts that haven't been reviewed within 72 hours.",
                      enabled: false,
                      locked: false,
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start justify-between gap-4 p-4 rounded-xl"
                      style={{ background: "oklch(0.14 0.012 260)" }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.title}</span>
                          {item.locked && (
                            <Badge className="text-[10px] bg-muted/60 text-muted-foreground border-0">Required</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                      </div>
                      <Switch checked={item.enabled} disabled={item.locked} />
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl"
                  style={{ background: "oklch(0.65 0.22 280 / 0.06)", border: "1px solid oklch(0.65 0.22 280 / 0.2)" }}>
                  <div className="text-sm font-medium mb-2">Approval Flow Summary</div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {[
                      "1. Editor generates AI content and submits for approval",
                      "2. Admin receives notification via email and/or WhatsApp",
                      "3. Admin reviews content in the Approval Center or via notification link",
                      "4. Admin approves → content moves to scheduling queue",
                      "5. Admin rejects → editor notified with feedback",
                      "6. Approved content is scheduled and auto-published at the set time",
                    ].map((step) => (
                      <div key={step} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Globe,
  Image,
  Instagram,
  Linkedin,
  Loader2,
  Play,
  Send,
  Sparkles,
  Twitter,
  Youtube,
  Zap,
  Copy,
  CheckCircle2,
  Hash,
  FileText,
  Video,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-400" },
  { id: "facebook", name: "Facebook", icon: Globe, color: "text-blue-400" },
  { id: "twitter", name: "X (Twitter)", icon: Twitter, color: "text-sky-400" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-500" },
  { id: "tiktok", name: "TikTok", icon: Zap, color: "text-white" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-400" },
];

const TONES = ["Professional", "Casual", "Humorous", "Inspirational", "Educational", "Promotional", "Storytelling"];

type GeneratedPost = {
  postId: number;
  caption: string;
  hashtags: string;
  imageUrl?: string;
  imagePrompt?: string;
};

type GeneratedVideo = {
  postId: number;
  title: string;
  script: string;
  slides: string[];
  caption: string;
  hashtags: string;
  thumbnailUrl?: string;
};

export default function ContentGenerator() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("post");

  // Post form state
  const [postPlatform, setPostPlatform] = useState("");
  const [postAccountId, setPostAccountId] = useState<number | null>(null);
  const [postTopic, setPostTopic] = useState("");
  const [postTone, setPostTone] = useState("Professional");
  const [includeImage, setIncludeImage] = useState(true);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [editedCaption, setEditedCaption] = useState("");
  const [editedHashtags, setEditedHashtags] = useState("");
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Video form state
  const [videoPlatform, setVideoPlatform] = useState("");
  const [videoAccountId, setVideoAccountId] = useState<number | null>(null);
  const [videoTopic, setVideoTopic] = useState("");
  const [videoStyle, setVideoStyle] = useState<"slideshow" | "text_to_video">("slideshow");
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);

  const utils = trpc.useUtils();
  const { data: accounts } = trpc.socialAccounts.list.useQuery();
  const connectedAccounts = accounts?.filter((a) => a.isConnected) ?? [];

  const generatePostMutation = trpc.content.generatePost.useMutation({
    onSuccess: (data) => {
      setGeneratedPost({ ...data, postId: data.postId ?? 0 });
      setEditedCaption(data.caption);
      setEditedHashtags(data.hashtags);
      utils.content.list.invalidate();
      toast.success("Post generated successfully!");
    },
    onError: (e) => toast.error(e.message),
  });

  const generateVideoMutation = trpc.content.generateVideo.useMutation({
    onSuccess: (data) => {
      setGeneratedVideo(data);
      utils.content.list.invalidate();
      toast.success("Video concept generated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.content.update.useMutation({
    onSuccess: () => utils.content.list.invalidate(),
  });

  const submitApprovalMutation = trpc.content.submitForApproval.useMutation({
    onSuccess: () => {
      toast.success("Submitted for admin approval! You'll be notified once reviewed.");
      navigate("/queue");
    },
    onError: (e) => toast.error(e.message),
  });

  const filteredAccounts = (platform: string) =>
    connectedAccounts.filter((a) => a.platform === platform);

  const handleGeneratePost = () => {
    if (!postPlatform || !postAccountId) {
      toast.error("Please select a platform and account");
      return;
    }
    generatePostMutation.mutate({
      platform: postPlatform as never,
      socialAccountId: postAccountId!,
      topic: postTopic || undefined,
      tone: postTone,
      includeImage,
    });
  };

  const handleGenerateVideo = () => {
    if (!videoPlatform || !videoAccountId) {
      toast.error("Please select a platform and account");
      return;
    }
    generateVideoMutation.mutate({
      platform: videoPlatform as never,
      socialAccountId: videoAccountId!,
      topic: videoTopic || undefined,
      style: videoStyle,
    });
  };

  const handleSaveEdits = async () => {
    if (!generatedPost) return;
    await updateMutation.mutateAsync({
      id: generatedPost.postId,
      caption: editedCaption,
      hashtags: editedHashtags,
    });
    toast.success("Changes saved");
  };

  const handleSubmitForApproval = (postId: number) => {
    submitApprovalMutation.mutate({ postId });
  };

  const copyCaption = () => {
    if (editedCaption) {
      navigator.clipboard.writeText(editedCaption + "\n\n" + editedHashtags);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
            <Sparkles className="w-6 h-6 inline mr-2 text-purple-400" />
            AI Content Generator
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate AI-powered posts and videos tailored to your brand
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="border border-border/50 p-1" style={{ background: "oklch(0.11 0.012 260)" }}>
            <TabsTrigger value="post" className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" /> Post Generator
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-1.5 text-xs">
              <Video className="w-3.5 h-3.5" /> Video Generator
            </TabsTrigger>
          </TabsList>

          {/* ─── Post Generator ─────────────────────────────────────────────── */}
          <TabsContent value="post" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Form */}
              <div className="space-y-5 p-6 rounded-2xl border border-border/50"
                style={{ background: "oklch(0.11 0.012 260)" }}>
                <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Configure Post</h2>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Platform *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {PLATFORMS.map((p) => (
                      <button key={p.id} onClick={() => { setPostPlatform(p.id); setPostAccountId(null); }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all ${postPlatform === p.id ? "border-primary/50" : "border-border/50 hover:border-border"}`}
                        style={{ background: postPlatform === p.id ? "oklch(0.65 0.22 280 / 0.1)" : "oklch(0.14 0.012 260)" }}>
                        <p.icon className={`w-4 h-4 ${p.color}`} />
                        <span className="text-[10px]">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {postPlatform && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Account *</Label>
                    {filteredAccounts(postPlatform).length === 0 ? (
                      <div className="p-3 rounded-xl text-xs text-muted-foreground text-center border border-border/50"
                        style={{ background: "oklch(0.14 0.012 260)" }}>
                        No {postPlatform} accounts connected.{" "}
                        <a href="/accounts" className="text-primary underline">Connect one</a>
                      </div>
                    ) : (
                      <Select value={postAccountId?.toString() ?? ""} onValueChange={(v) => setPostAccountId(parseInt(v))}>
                        <SelectTrigger className="border-border/50" style={{ background: "oklch(0.14 0.012 260)" }}>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent style={{ background: "oklch(0.12 0.012 260)", border: "1px solid oklch(0.22 0.015 260)" }}>
                          {filteredAccounts(postPlatform).map((acc) => (
                            <SelectItem key={acc.id} value={acc.id.toString()}>
                              @{acc.accountHandle} — {acc.accountName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Topic / Brief (optional)</Label>
                  <Input value={postTopic} onChange={(e) => setPostTopic(e.target.value)}
                    placeholder="e.g. New product launch, summer sale, tips..."
                    className="border-border/50" style={{ background: "oklch(0.14 0.012 260)" }} />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Tone</Label>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map((tone) => (
                      <button key={tone} onClick={() => setPostTone(tone)}
                        className={`px-3 py-1 rounded-full text-xs border transition-all ${postTone === tone ? "border-primary/50 text-primary" : "border-border/50 text-muted-foreground hover:border-border"}`}
                        style={{ background: postTone === tone ? "oklch(0.65 0.22 280 / 0.1)" : "oklch(0.14 0.012 260)" }}>
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border/50"
                  style={{ background: "oklch(0.14 0.012 260)" }}>
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs font-medium">Generate AI Image</div>
                      <div className="text-[10px] text-muted-foreground">Create a matching visual</div>
                    </div>
                  </div>
                  <Switch checked={includeImage} onCheckedChange={setIncludeImage} />
                </div>

                <Button onClick={handleGeneratePost} disabled={generatePostMutation.isPending || !postPlatform || !postAccountId}
                  className="w-full h-10" style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
                  {generatePostMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Generate Post</>
                  )}
                </Button>
              </div>

              {/* Preview */}
              <div className="p-6 rounded-2xl border border-border/50 space-y-4"
                style={{ background: "oklch(0.11 0.012 260)" }}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Preview & Edit</h2>
                  {generatedPost && (
                    <Button variant="ghost" size="sm" onClick={copyCaption} className="h-7 text-xs gap-1.5">
                      {copiedCaption ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedCaption ? "Copied!" : "Copy"}
                    </Button>
                  )}
                </div>

                {!generatedPost ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "oklch(0.65 0.22 280 / 0.1)" }}>
                      <Sparkles className="w-8 h-8 text-purple-400/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">Configure your post and click Generate</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {generatedPost.imageUrl && (
                      <div className="rounded-xl overflow-hidden aspect-square">
                        <img src={generatedPost.imageUrl} alt="Generated" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                        <FileText className="w-3 h-3" /> Caption
                      </Label>
                      <Textarea value={editedCaption} onChange={(e) => setEditedCaption(e.target.value)}
                        className="text-sm border-border/50 resize-none min-h-[120px]"
                        style={{ background: "oklch(0.14 0.012 260)" }} />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                        <Hash className="w-3 h-3" /> Hashtags
                      </Label>
                      <Input value={editedHashtags} onChange={(e) => setEditedHashtags(e.target.value)}
                        className="text-sm border-border/50" style={{ background: "oklch(0.14 0.012 260)" }} />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" onClick={handleSaveEdits} className="flex-1 border-border/50 text-xs h-9"
                        disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Edits"}
                      </Button>
                      <Button size="sm" onClick={() => handleSubmitForApproval(generatedPost.postId)}
                        className="flex-1 text-xs h-9"
                        style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}
                        disabled={submitApprovalMutation.isPending}>
                        {submitApprovalMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <><Send className="w-3 h-3 mr-1.5" /> Submit for Approval</>
                        )}
                      </Button>
                    </div>

                    <div className="p-3 rounded-xl text-xs text-muted-foreground"
                      style={{ background: "oklch(0.65 0.22 280 / 0.06)", border: "1px solid oklch(0.65 0.22 280 / 0.15)" }}>
                      <strong className="text-foreground">Next step:</strong> Submit for admin approval. The admin will be notified via email and WhatsApp.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ─── Video Generator ─────────────────────────────────────────────── */}
          <TabsContent value="video" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Form */}
              <div className="space-y-5 p-6 rounded-2xl border border-border/50"
                style={{ background: "oklch(0.11 0.012 260)" }}>
                <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Configure Video</h2>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Platform *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {PLATFORMS.map((p) => (
                      <button key={p.id} onClick={() => { setVideoPlatform(p.id); setVideoAccountId(null); }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all ${videoPlatform === p.id ? "border-primary/50" : "border-border/50 hover:border-border"}`}
                        style={{ background: videoPlatform === p.id ? "oklch(0.65 0.22 280 / 0.1)" : "oklch(0.14 0.012 260)" }}>
                        <p.icon className={`w-4 h-4 ${p.color}`} />
                        <span className="text-[10px]">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {videoPlatform && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Account *</Label>
                    {filteredAccounts(videoPlatform).length === 0 ? (
                      <div className="p-3 rounded-xl text-xs text-muted-foreground text-center border border-border/50"
                        style={{ background: "oklch(0.14 0.012 260)" }}>
                        No {videoPlatform} accounts connected.
                      </div>
                    ) : (
                      <Select value={videoAccountId?.toString() ?? ""} onValueChange={(v) => setVideoAccountId(parseInt(v))}>
                        <SelectTrigger className="border-border/50" style={{ background: "oklch(0.14 0.012 260)" }}>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent style={{ background: "oklch(0.12 0.012 260)", border: "1px solid oklch(0.22 0.015 260)" }}>
                          {filteredAccounts(videoPlatform).map((acc) => (
                            <SelectItem key={acc.id} value={acc.id.toString()}>
                              @{acc.accountHandle} — {acc.accountName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Video Topic / Brief</Label>
                  <Input value={videoTopic} onChange={(e) => setVideoTopic(e.target.value)}
                    placeholder="e.g. Top 5 productivity tips, product showcase..."
                    className="border-border/50" style={{ background: "oklch(0.14 0.012 260)" }} />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Video Style</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "slideshow", label: "Slideshow", icon: Play, desc: "Image slides with text overlays" },
                      { id: "text_to_video", label: "Text to Video", icon: Video, desc: "Script-based video generation" },
                    ].map((style) => (
                      <button key={style.id} onClick={() => setVideoStyle(style.id as never)}
                        className={`p-3 rounded-xl border text-left transition-all ${videoStyle === style.id ? "border-primary/50" : "border-border/50"}`}
                        style={{ background: videoStyle === style.id ? "oklch(0.65 0.22 280 / 0.1)" : "oklch(0.14 0.012 260)" }}>
                        <style.icon className={`w-4 h-4 mb-2 ${videoStyle === style.id ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="text-xs font-medium">{style.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{style.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleGenerateVideo} disabled={generateVideoMutation.isPending || !videoPlatform || !videoAccountId}
                  className="w-full h-10" style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
                  {generateVideoMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                  ) : (
                    <><Video className="w-4 h-4 mr-2" /> Generate Video Concept</>
                  )}
                </Button>
              </div>

              {/* Video Preview */}
              <div className="p-6 rounded-2xl border border-border/50 space-y-4"
                style={{ background: "oklch(0.11 0.012 260)" }}>
                <h2 className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Video Concept</h2>

                {!generatedVideo ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "oklch(0.65 0.22 280 / 0.1)" }}>
                      <Video className="w-8 h-8 text-purple-400/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">Configure your video and click Generate</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {generatedVideo.thumbnailUrl && (
                      <div className="rounded-xl overflow-hidden aspect-video">
                        <img src={generatedVideo.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Title</div>
                      <div className="text-sm font-semibold">{generatedVideo.title}</div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Slides ({generatedVideo.slides.length})</div>
                      <div className="space-y-2">
                        {generatedVideo.slides.map((slide, i) => (
                          <div key={i} className="flex gap-2 p-2.5 rounded-lg text-xs"
                            style={{ background: "oklch(0.14 0.012 260)" }}>
                            <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary/20 text-primary border-0 shrink-0">
                              {i + 1}
                            </Badge>
                            <span className="text-muted-foreground">{slide}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Script Preview</div>
                      <div className="text-xs text-muted-foreground p-3 rounded-lg line-clamp-4"
                        style={{ background: "oklch(0.14 0.012 260)" }}>
                        {generatedVideo.script}
                      </div>
                    </div>

                    <Button size="sm" onClick={() => handleSubmitForApproval(generatedVideo.postId)}
                      className="w-full text-xs h-9"
                      style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}
                      disabled={submitApprovalMutation.isPending}>
                      {submitApprovalMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <><Send className="w-3 h-3 mr-1.5" /> Submit for Approval</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

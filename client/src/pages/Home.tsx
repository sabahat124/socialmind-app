import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import {
  Sparkles,
  Calendar,
  Shield,
  BarChart3,
  Zap,
  Users,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  CheckCircle2,
  ArrowRight,
  Play,
  Globe,
  Clock,
  Bell,
} from "lucide-react";

const PLATFORMS = [
  { name: "Instagram", icon: Instagram, color: "text-pink-400" },
  { name: "Facebook", icon: Globe, color: "text-blue-400" },
  { name: "X / Twitter", icon: Twitter, color: "text-sky-400" },
  { name: "LinkedIn", icon: Linkedin, color: "text-blue-500" },
  { name: "TikTok", icon: Play, color: "text-white" },
  { name: "YouTube", icon: Youtube, color: "text-red-400" },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Content Generation",
    description: "Generate captions, hashtags, and visuals tailored to your brand voice and page theme — instantly.",
    gradient: "from-purple-500/20 to-blue-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: Shield,
    title: "Admin Approval Workflow",
    description: "Every post requires explicit admin approval via email or WhatsApp before going live. Zero unauthorized publishing.",
    gradient: "from-emerald-500/20 to-cyan-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "AI-suggested optimal posting times with a full content calendar and manual override options.",
    gradient: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track impressions, engagement rates, and performance across all platforms in one unified view.",
    gradient: "from-orange-500/20 to-rose-500/20",
    iconColor: "text-orange-400",
  },
  {
    icon: Users,
    title: "Multi-User Workspace",
    description: "Invite editors, assign roles, and manage your entire team's content workflow with strict role separation.",
    gradient: "from-pink-500/20 to-purple-500/20",
    iconColor: "text-pink-400",
  },
  {
    icon: Zap,
    title: "Video Generation",
    description: "Create AI-powered short videos and slideshows based on your page theme and trending content.",
    gradient: "from-yellow-500/20 to-orange-500/20",
    iconColor: "text-yellow-400",
  },
];

const WORKFLOW_STEPS = [
  { icon: Globe, title: "Connect Accounts", desc: "Link your social profiles in seconds", color: "bg-blue-500/20 text-blue-400" },
  { icon: Sparkles, title: "Generate Content", desc: "AI creates posts tailored to your brand", color: "bg-purple-500/20 text-purple-400" },
  { icon: Bell, title: "Request Approval", desc: "Admin notified via email or WhatsApp", color: "bg-amber-500/20 text-amber-400" },
  { icon: Clock, title: "Schedule & Publish", desc: "Auto-publish at the perfect time", color: "bg-emerald-500/20 text-emerald-400" },
];

export default function Home() {
  const [, navigate] = useLocation();

  // CEO Override: Direct path to dashboard
  const handleGetStarted = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50"
        style={{ background: "oklch(0.08 0.01 260 / 0.85)", backdropFilter: "blur(20px)" }}>
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ fontFamily: "Syne, sans-serif" }}>SocialMind</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleGetStarted} className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
            <Button size="sm" onClick={handleGetStarted}
              style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
              Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="relative max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs font-medium border border-border/60"
            style={{ background: "oklch(0.65 0.22 280 / 0.15)", color: "oklch(0.8 0.15 280)" }}>
            <Sparkles className="w-3 h-3 mr-1.5 inline" />
            AI-Powered Social Media Management
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            style={{ fontFamily: "Syne, sans-serif" }}>
            Create. Approve.{" "}
            <span style={{
              background: "linear-gradient(135deg, oklch(0.75 0.22 280), oklch(0.72 0.2 240), oklch(0.78 0.22 340))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Publish Smarter.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one platform for your 9 brands to generate AI-powered content and schedule posts.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" onClick={handleGetStarted} className="px-8 h-12 text-base font-semibold shadow-lg"
              style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
              Open Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>SocialMind</span>
          <p className="text-xs text-muted-foreground">© 2026 SocialMind. Serving Azure Art Gallery & The Solopreneur Arc.</p>
        </div>
      </footer>
    </div>
  );
}
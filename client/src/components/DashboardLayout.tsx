import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Bell,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Settings,
  Sparkles,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Wifi, label: "Social Accounts", path: "/accounts" },
  { icon: Sparkles, label: "Create Content", path: "/create" },
  { icon: CheckSquare, label: "Content Queue", path: "/queue" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: Bell, label: "Approvals", path: "/approvals", adminOnly: false },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
];

const adminMenuItems = [
  { icon: Users, label: "Team", path: "/team" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "sm-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 320;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Sign in to SocialMind</h1>
            <p className="text-sm text-muted-foreground">Access your social media management dashboard</p>
          </div>
          <Button onClick={() => { window.location.href = getLoginUrl(); }} size="lg" className="w-full"
            style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === "admin";

  // Pending approvals count for badge
  const { data: pendingPosts } = trpc.content.list.useQuery({ status: "pending_approval" });
  const pendingCount = pendingPosts?.length ?? 0;

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - left;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const allMenuItems = isAdmin ? [...menuItems, ...adminMenuItems] : menuItems;

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-sidebar-border" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-3">
              <button onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors shrink-0 focus:outline-none">
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280), oklch(0.62 0.2 240))" }}>
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-bold text-sm truncate" style={{ fontFamily: "Syne, sans-serif" }}>SocialMind</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-3">
            <SidebarMenu className="px-2 space-y-0.5">
              {allMenuItems.map((item) => {
                const isActive = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path));
                const showBadge = item.path === "/approvals" && isAdmin && pendingCount > 0;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-9 transition-all font-normal relative"
                    >
                      <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={isActive ? "text-foreground font-medium" : "text-muted-foreground"}>{item.label}</span>
                      {showBadge && !isCollapsed && (
                        <Badge className="ml-auto h-5 min-w-5 px-1.5 text-xs bg-primary/20 text-primary border-0">
                          {pendingCount}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {!isCollapsed && (
              <div className="px-4 mt-4">
                <div className="h-px bg-sidebar-border" />
              </div>
            )}

            {!isCollapsed && (
              <div className="px-4 mt-4">
                <button onClick={() => setLocation("/create")}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280 / 0.2), oklch(0.62 0.2 240 / 0.2))", border: "1px solid oklch(0.65 0.22 280 / 0.3)", color: "oklch(0.8 0.15 280)" }}>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Generate Content</span>
                </button>
              </div>
            )}
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-sidebar-accent transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={user?.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs font-semibold"
                      style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 280 / 0.3), oklch(0.62 0.2 240 / 0.3))", color: "oklch(0.8 0.15 280)" }}>
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium truncate leading-none">{user?.name ?? "User"}</p>
                        {isAdmin && (
                          <Badge className="h-4 px-1 text-[10px] bg-purple-500/20 text-purple-400 border-0 shrink-0">Admin</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-1">{user?.email ?? ""}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" style={{ background: "oklch(0.12 0.012 260)", border: "1px solid oklch(0.22 0.015 260)" }}>
                <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        <main className="flex-1 min-h-screen bg-background">{children}</main>
      </SidebarInset>
    </>
  );
}

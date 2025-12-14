import React from "react";
import {
  Globe,
  Database,
  Code2,
  Webhook,
  Settings,
  Users,
  CreditCard,
  BookOpen,
  ChevronsUpDown,
  Sparkles,
  LogOut,
  Terminal,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "../ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Link, useNavigate } from "react-router";
import { useSupabase } from "~/hooks/useAuth";
import { useTokenStore } from "~/stores/tokenStore";
import { useGetMe, type TeamInfo } from "~/hooks/query/useGetMe";
import { getPlanDisplayName } from "~/pages/dashboard/utils/planUtils";
import { supabase } from "~/lib/supabaseClient";
import { useSidebar } from "../ui/sidebar";

interface DashboardSidebarProps {
  currentPath: string;
}

/**
 * Get user initials from name or email
 */
function getUserInitials(
  fullName: string | unknown,
  email: string | unknown
): string {
  if (typeof fullName === "string" && fullName.trim()) {
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }
  if (typeof email === "string" && email.trim()) {
    return email.substring(0, 2).toUpperCase();
  }
  return "U";
}

/**
 * TeamSwitcher component for selecting teams
 */
function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const { data: userData } = useGetMe();

  // Get teams from userData, fallback to default if not available
  function getTeams(): Array<{
    name: string;
    plan: string;
    teamInfo: TeamInfo;
  }> {
    if (!userData?.teams || userData.teams.length === 0) {
      // Fallback to default team if no teams available
      const plan = typeof userData?.plan === "string" ? userData.plan : "free";
      const planDisplayName = getPlanDisplayName(plan);
      return [
        {
          name: "LocalizeKit",
          plan: planDisplayName,
          teamInfo: {
            projectCount: 0,
            plan: userData?.plan ?? null,
            canCreateProject: true,
            teamName: "LocalizeKit",
            memberCount: 1,
          },
        },
      ];
    }

    // Map TeamInfo[] to display format
    return userData.teams.map((teamInfo) => ({
      name: teamInfo.teamName,
      plan: getPlanDisplayName(
        typeof teamInfo.plan === "string" ? teamInfo.plan : "free"
      ),
      teamInfo,
    }));
  }

  const teams = getTeams();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);

  // Update active team when teams change
  React.useEffect(() => {
    const currentTeams = getTeams();
    if (
      currentTeams.length > 0 &&
      (!activeTeam || !currentTeams.some((t) => t.name === activeTeam.name))
    ) {
      setActiveTeam(currentTeams[0]);
    }
  }, [userData, activeTeam]);

  if (!activeTeam || teams.length === 0) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:mb-2"
            >
              {typeof activeTeam.teamInfo.avatarUrl === "string" &&
              activeTeam.teamInfo.avatarUrl ? (
                <Avatar className="size-8 shrink-0">
                  <AvatarImage
                    src={activeTeam.teamInfo.avatarUrl}
                    alt={activeTeam.name}
                  />
                  <AvatarFallback className="bg-blue-600 text-sidebar-primary-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-5 text-white"
                    >
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <path d="M3 10h18" />
                      <path d="M12 10v10" />
                      <path d="M7 7h.01" />
                      <path d="M11 7h.01" />
                      <path d="M6 14h3" />
                      <path d="M6 17h2" />
                      <path d="M15 14h2" />
                      <path d="M15 17h3" />
                    </svg>
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-sidebar-primary-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-5 text-white"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M3 10h18" />
                    <path d="M12 10v10" />
                    <path d="M7 7h.01" />
                    <path d="M11 7h.01" />
                    <path d="M6 14h3" />
                    <path d="M6 17h2" />
                    <path d="M15 14h2" />
                    <path d="M15 17h3" />
                  </svg>
                </div>
              )}
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2"
              >
                {typeof team.teamInfo.avatarUrl === "string" &&
                team.teamInfo.avatarUrl ? (
                  <Avatar className="size-6 shrink-0">
                    <AvatarImage
                      src={team.teamInfo.avatarUrl}
                      alt={team.name}
                    />
                    <AvatarFallback className="bg-blue-600 text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-3.5 shrink-0"
                      >
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M3 10h18" />
                        <path d="M12 10v10" />
                        <path d="M7 7h.01" />
                        <path d="M11 7h.01" />
                        <path d="M6 14h3" />
                        <path d="M6 17h2" />
                        <path d="M15 14h2" />
                        <path d="M15 17h3" />
                      </svg>
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex size-6 items-center justify-center rounded-md border bg-blue-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-3.5 shrink-0 text-white"
                    >
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <path d="M3 10h18" />
                      <path d="M12 10v10" />
                      <path d="M7 7h.01" />
                      <path d="M11 7h.01" />
                      <path d="M6 14h3" />
                      <path d="M6 17h2" />
                      <path d="M15 14h2" />
                      <path d="M15 17h3" />
                    </svg>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-medium">{team.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {team.plan}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function DashboardSidebar({ currentPath }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const { clear } = useTokenStore();
  const { data: userData } = useGetMe();

  // Extract user info with fallbacks
  const fullName =
    typeof userData?.fullName === "string" ? userData.fullName : null;
  const email =
    typeof userData?.email === "string"
      ? userData.email
      : "user@localizekit.com";
  const avatarUrl =
    typeof userData?.avatarUrl === "string" ? userData.avatarUrl : undefined;
  const plan = typeof userData?.plan === "string" ? userData.plan : "free";
  const planDisplayName = getPlanDisplayName(plan);
  const userInitials = getUserInitials(fullName, email);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clear();
    navigate("/");
  };

  const navMain = [
    {
      title: "Platform",
      items: [
        { id: "projects", title: "Projects", icon: Globe, path: "/dashboard" },
        {
          id: "translations",
          title: "Translation Memory",
          icon: Database,
          path: "/dashboard/translations",
        },
        {
          id: "api-keys",
          title: "API Keys",
          icon: Terminal,
          path: "/dashboard/api-keys",
        },
        {
          id: "webhooks",
          title: "Webhooks",
          icon: Webhook,
          path: "/dashboard/webhooks",
        },
      ],
    },
    {
      title: "Organization",
      items: [
        {
          id: "team",
          title: "Team Members",
          icon: Users,
          path: "/dashboard/team",
        },
        {
          id: "billing",
          title: "Billing & Usage",
          icon: CreditCard,
          path: "/dashboard/billing",
        },
        {
          id: "settings",
          title: "Settings",
          icon: Settings,
          path: "/dashboard/settings",
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent>
        {navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = currentPath === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        asChild
                        tooltip={item.title}
                        className={isActive ? "text-blue-600 font-medium" : ""}
                      >
                        <Link to={item.path}>
                          <item.icon
                            className={isActive ? "text-blue-600" : ""}
                          />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-800"
                  tooltip="Upgrade to Pro"
                >
                  <Link to="/pricing">
                    <Sparkles className="text-blue-600 dark:text-blue-400 fill-current" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Upgrade to Pro
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Documentation">
                  <a
                    href="https://docs.localizekit.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpen />
                    <span>Documentation</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:mb-2"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatarUrl} alt={userInitials} />
                    <AvatarFallback className="rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">
                      {fullName || "User"}
                    </span>
                    <span className="truncate text-xs">{email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={avatarUrl} alt={userInitials} />
                      <AvatarFallback className="rounded-lg">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-semibold">
                        {fullName || "User"}
                      </span>
                      <span className="truncate text-xs">{email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/pricing">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/billing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

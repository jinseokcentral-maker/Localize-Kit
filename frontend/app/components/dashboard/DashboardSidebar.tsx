import {
  BookOpen,
  Check,
  ChevronsUpDown,
  CreditCard,
  Database,
  Globe,
  LogOut,
  Settings,
  Sparkles,
  Terminal,
  Users,
  Webhook,
} from "lucide-react";

import { Effect } from "effect";
import { parseAsString, useQueryState } from "nuqs";
import { Link, useNavigate } from "react-router";
import { useGetMe } from "~/hooks/query/useGetMe";
import { supabase } from "~/lib/supabaseClient";
import { useTokenStore } from "~/stores/tokenStore";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
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
  useSidebar,
} from "../ui/sidebar";
import {
  getTeamsEffect,
  getUserInitialsEffect,
  shouldShowUpgradeEffect,
} from "./utils/teamUtils";

interface DashboardSidebarProps {
  currentPath: string;
}

/**
 * TeamSwitcher component for selecting teams
 */
function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const { data: userData } = useGetMe();
  const [teamId, setTeamId] = useQueryState("team", parseAsString);

  // Get teams from userData using Effect pattern
  const teams = Effect.runSync(
    getTeamsEffect(userData?.teams).pipe(
      Effect.catchAll(() => Effect.succeed([]))
    )
  );

  // Find personal team (default)
  const personalTeam = teams.find((team) => team.teamInfo.personal === true);

  // Find active team based on URL parameter
  // If no teamId, use personal team as default
  const activeTeam = teamId
    ? teams.find((team) => team.id === teamId)
    : personalTeam || null;

  // Handle team selection
  const handleTeamSelect = (team: (typeof teams)[0]) => {
    setTeamId(team.id);
  };

  // Display team (personal team is default if no teamId)
  const displayTeam = activeTeam || personalTeam;

  // Don't render if no teams available
  if (!displayTeam || teams.length === 0) {
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
              {typeof displayTeam.teamInfo.avatarUrl === "string" &&
              displayTeam.teamInfo.avatarUrl ? (
                <Avatar className="size-8 shrink-0">
                  <AvatarImage
                    src={displayTeam.teamInfo.avatarUrl}
                    alt={displayTeam.name}
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
                  {displayTeam.name}
                </span>
                <span className="truncate text-xs">{displayTeam.plan}</span>
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
            {/* Personal team option */}
            {personalTeam && (
              <DropdownMenuItem
                key={personalTeam.id}
                onClick={() => handleTeamSelect(personalTeam)}
                className="gap-2 p-2"
              >
                {typeof personalTeam.teamInfo.avatarUrl === "string" &&
                personalTeam.teamInfo.avatarUrl ? (
                  <Avatar className="size-6 shrink-0">
                    <AvatarImage
                      src={personalTeam.teamInfo.avatarUrl}
                      alt={personalTeam.name}
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
                <div className="flex flex-col flex-1">
                  <span className="font-medium">{personalTeam.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {personalTeam.plan}
                  </span>
                </div>
                {displayTeam.id === personalTeam.id && (
                  <Check className="size-4 text-foreground ml-auto" />
                )}
              </DropdownMenuItem>
            )}
            {personalTeam &&
              teams.filter((t) => !t.teamInfo.personal).length > 0 && (
                <DropdownMenuSeparator />
              )}
            {/* Other teams (non-personal) */}
            {teams
              .filter((team) => !team.teamInfo.personal)
              .map((team) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => handleTeamSelect(team)}
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
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{team.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {team.plan}
                    </span>
                  </div>
                  {displayTeam.id === team.id && (
                    <Check className="size-4 text-foreground ml-auto" />
                  )}
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
  const [teamId] = useQueryState("team", parseAsString);

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
  const userInitials = Effect.runSync(
    getUserInitialsEffect({ fullName, email })
  );

  // Check if Upgrade to Pro should be shown using Effect pattern
  const shouldShowUpgrade = Effect.runSync(
    shouldShowUpgradeEffect({
      plan,
      teamId,
      teams: userData?.teams,
    })
  );

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

        {shouldShowUpgrade && (
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
        )}

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
                {shouldShowUpgrade && (
                  <DropdownMenuItem asChild>
                    <Link to="/pricing">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </Link>
                  </DropdownMenuItem>
                )}
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

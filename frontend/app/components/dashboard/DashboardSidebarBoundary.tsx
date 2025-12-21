import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Effect } from "effect";
import { AlertCircle, RefreshCw } from "lucide-react";
import { getUsersMe } from "~/api";
import { extractApiData } from "~/lib/api/apiWrapper";
import { apiClient } from "~/lib/api/authClient";
import { useTokenStore } from "~/stores/tokenStore";
import { Button } from "../ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "../ui/sidebar";
import { Skeleton } from "../ui/skeleton";
import type { TeamInfo } from "~/hooks/query/useGetMe";
import { DashboardSidebarInner } from "./DashboardSidebar";

type SidebarUserData = {
  fullName?: string | unknown;
  email?: string | unknown;
  avatarUrl?: string | unknown;
  plan?: string | unknown;
  teams?: TeamInfo[];
};

interface DashboardSidebarProps {
  currentPath: string;
}

function getMeEffect(): Effect.Effect<SidebarUserData, Error> {
  return Effect.tryPromise({
    try: async () => {
      const response = await getUsersMe({
        client: apiClient,
        throwOnError: true,
      });
      return extractApiData<SidebarUserData>(response.data);
    },
    catch: (err) =>
      new Error(
        err instanceof Error ? err.message : "Failed to fetch user profile"
      ),
  });
}

function DashboardSidebarLoadingFallback() {
  // Use a neutral gray (instead of theme "accent", which can read blue in some palettes)
  const skeletonTone = "bg-zinc-200/80 dark:bg-zinc-800/60";
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex flex-col gap-2 p-2">
          <div className="flex items-center gap-2 overflow-hidden rounded-md p-2">
            <Skeleton className={`size-8 rounded-lg ${skeletonTone}`} />
            <div className="grid flex-1 gap-1 group-data-[collapsible=icon]:hidden">
              <Skeleton className={`h-4 w-28 ${skeletonTone}`} />
              <Skeleton className={`h-3 w-12 ${skeletonTone}`} />
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-2">
        <div className="p-2">
          <Skeleton
            className={`h-6 w-20 mb-2 group-data-[collapsible=icon]:opacity-0 ${skeletonTone}`}
          />
          <div className="space-y-2">
            <Skeleton className={`h-8 w-full ${skeletonTone}`} />
            <Skeleton className={`h-8 w-full ${skeletonTone}`} />
            <Skeleton className={`h-8 w-full ${skeletonTone}`} />
            <Skeleton className={`h-8 w-full ${skeletonTone}`} />
          </div>
        </div>
        <div className="p-2">
          <Skeleton
            className={`h-6 w-24 mb-2 group-data-[collapsible=icon]:opacity-0 ${skeletonTone}`}
          />
          <div className="space-y-2">
            <Skeleton className={`h-8 w-full ${skeletonTone}`} />
            <Skeleton className={`h-8 w-full ${skeletonTone}`} />
            <Skeleton className={`h-8 w-full ${skeletonTone}`} />
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
          <Skeleton className={`h-12 w-full rounded-md ${skeletonTone}`} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function DashboardSidebarErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-destructive shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">
                Failed to load sidebar
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {error.message || "An unexpected error occurred."}
              </div>
              <Button
                onClick={resetErrorBoundary}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter />
    </Sidebar>
  );
}

function DashboardSidebarSuspenseInner({ currentPath }: DashboardSidebarProps) {
  const { data: userData } = useSuspenseQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      return Effect.runPromise(getMeEffect());
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <DashboardSidebarInner currentPath={currentPath} userData={userData} />
  );
}

export function DashboardSidebar({ currentPath }: DashboardSidebarProps) {
  const queryClient = useQueryClient();
  const accessToken = useTokenStore((s) => s.accessToken);

  // If tokens are not ready yet (or user logged out), avoid suspense throwing here.
  if (!accessToken) {
    return <DashboardSidebarLoadingFallback />;
  }

  return (
    <ErrorBoundary
      FallbackComponent={DashboardSidebarErrorFallback}
      onReset={() => {
        queryClient.resetQueries({ queryKey: ["user", "me"] });
      }}
    >
      <Suspense fallback={<DashboardSidebarLoadingFallback />}>
        <DashboardSidebarSuspenseInner currentPath={currentPath} />
      </Suspense>
    </ErrorBoundary>
  );
}

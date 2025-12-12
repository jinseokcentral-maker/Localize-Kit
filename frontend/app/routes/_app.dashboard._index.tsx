import { DashboardPage } from "~/pages/dashboard";
import type { Route } from "./+types/_app.dashboard._index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - LocalizeKit" },
    { name: "description", content: "Manage your localization projects" },
  ];
}

export default function DashboardRoute() {
  return <DashboardPage />;
}


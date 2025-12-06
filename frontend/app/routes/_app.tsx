import { Outlet } from "react-router";
import AppLayout from "~/layouts/AppLayout";
import type { Route } from "./+types/_app";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Converter - LocalizeKit" },
    { name: "description", content: "Convert CSV to JSON instantly." },
  ];
}

export default function AppLayoutRoute() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

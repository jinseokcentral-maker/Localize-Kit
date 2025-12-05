import { Outlet } from "react-router";
import MarketingLayout from "~/layouts/MarketingLayout";
import type { Route } from "./+types/_marketing";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LocalizeKit - CSV to i18n JSON Converter" },
    { name: "description", content: "Instantly convert CSV to i18n JSON. Transform your spreadsheet translations into ready-to-use JSON, YAML, or i18n resource files." },
  ];
}

export default function MarketingLayoutRoute() {
  return (
    <MarketingLayout>
      <Outlet />
    </MarketingLayout>
  );
}


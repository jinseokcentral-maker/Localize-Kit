import LandingPage from "~/pages/landing";
import type { Route } from "./+types/_marketing._index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LocalizeKit - CSV to i18n JSON Converter" },
    { name: "description", content: "Instantly convert CSV to i18n JSON. Transform your spreadsheet translations into ready-to-use JSON, YAML, or i18n resource files." },
  ];
}

export default function LandingPageRoute() {
  return <LandingPage />;
}


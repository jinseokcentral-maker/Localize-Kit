import LandingPage from "~/pages/landing";
import type { Route } from "./+types/_marketing._index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LocalizeKit - CSV to i18n JSON Converter" },
    {
      name: "description",
      content:
        "Instantly convert CSV to i18n JSON. Transform your spreadsheet translations into ready-to-use JSON files.",
    },
  ];
}

export default function LandingPageRoute() {
  return <LandingPage />;
}

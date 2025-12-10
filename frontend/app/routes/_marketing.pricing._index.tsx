import PricingPage from "~/pages/pricing";
import type { Route } from "./+types/_marketing.pricing._index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Pricing - LocalizeKit" },
    {
      name: "description",
      content:
        "Choose the right LocalizeKit plan for your team. Free, Pro, and Team tiers for CSV/Excel to i18n JSON, API delivery, and collaboration.",
    },
  ];
}

export default function PricingPageRoute() {
  return <PricingPage />;
}






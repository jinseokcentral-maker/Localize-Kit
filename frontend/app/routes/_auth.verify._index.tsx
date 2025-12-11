import { VerifyPage } from "~/pages/auth/verify";
import type { Route } from "./+types/_auth.verify._index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Verify - LocalizeKit" },
    { name: "description", content: "Verify your email to continue" },
  ];
}

export default function VerifyPageRoute() {
  return <VerifyPage />;
}



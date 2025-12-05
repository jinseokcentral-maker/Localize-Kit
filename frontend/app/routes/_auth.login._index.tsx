import LoginPage from "~/pages/auth/login";
import type { Route } from "./+types/_auth.login._index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - LocalizeKit" },
    { name: "description", content: "Sign in to LocalizeKit" },
  ];
}

export default function LoginPageRoute() {
  return <LoginPage />;
}


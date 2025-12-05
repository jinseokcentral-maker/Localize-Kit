import { Outlet } from "react-router";
import AuthLayout from "~/layouts/AuthLayout";
import type { Route } from "./+types/_auth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - LocalizeKit" },
    { name: "description", content: "Sign in to LocalizeKit" },
  ];
}

export default function AuthLayoutRoute() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}


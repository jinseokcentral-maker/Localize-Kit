import {
  isRouteErrorResponse,
  Links,
  Meta,
  Navigate,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { useLoadWasmParser } from "~/hooks/useLoadWasmParser";
import { useAuth } from "~/hooks/useAuth";
import { NOT_AUTH_PATH, EXTERNAL_LINK_PATH } from "~/constants/config";

import type { Route } from "./+types/root";
import "./app.css";
import { Toaster } from "./components/ui/sonner";
import { useBootstrapProfile } from "./hooks/useBootstrapProfile";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  { rel: "preconnect", href: "https://cdn.jsdelivr.net" },
  // Geist Sans & Mono from CDN
  {
    rel: "stylesheet",
    href: "https://cdn.jsdelivr.net/npm/geist@1.2.2/dist/fonts/geist-sans/style.css",
  },
  {
    rel: "stylesheet",
    href: "https://cdn.jsdelivr.net/npm/geist@1.2.2/dist/fonts/geist-mono/style.css",
  },
  // JetBrains Mono for code blocks
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  useLoadWasmParser();

  useBootstrapProfile();

  return (
    <NuqsAdapter>
      <Outlet />
      <Toaster />
    </NuqsAdapter>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

import Header from "~/components/landing/Header";
import { EditorSection } from "~/components/landing/editor";
import { ProBanner } from "~/components/landing/ProBanner";
import type { Route } from "./+types/_app.app._index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Converter - LocalizeKit" },
    { name: "description", content: "Convert CSV to JSON instantly." },
  ];
}

export default function ConverterPageRoute() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pb-12">
        <ProBanner />
        <EditorSection />
      </main>
    </div>
  );
}

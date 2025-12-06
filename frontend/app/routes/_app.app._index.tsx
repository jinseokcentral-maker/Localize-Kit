import Header from "~/components/landing/Header";
import { EditorSection } from "~/components/landing/editor";
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
      <main className="px-8 pb-12">
        <EditorSection />
      </main>
    </div>
  );
}

import ConverterPage from "~/pages/converter";
import type { Route } from "./+types/_app.app._index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Converter - LocalizeKit" },
    { name: "description", content: "Convert CSV to JSON, YAML, or i18n resource files instantly." },
  ];
}

export default function ConverterPageRoute() {
  return <ConverterPage />;
}


import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import {
  TranslationTable,
  TranslationDetailPanel,
  type TranslationKey,
} from "~/components/translations/TranslationTable";
import {
  TranslationFilters,
  TranslationTopBar,
} from "~/components/translations/TranslationTopBar";
import { TranslationCsvEditor } from "~/components/translations/TranslationCsvEditor";
import type { Route } from "./+types/_app.dashboard.projects.$projectId._index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Project Translations - LocalizeKit" },
    {
      name: "description",
      content: "Manage translations across languages for this project.",
    },
  ];
}

const mockKeys: TranslationKey[] = [
  {
    id: "1",
    key: "common.submit",
    context: "Button label for submitting forms",
    translations: { en: "Submit", ko: "제출", ja: "送信" },
    status: "translated",
  },
  {
    id: "2",
    key: "auth.login.title",
    context: "Login screen title",
    translations: { en: "Welcome back", ko: "", ja: "" },
    status: "warning",
  },
  {
    id: "3",
    key: "errors.network",
    context: "Shown when network fails",
    translations: { en: "Network error", ko: "", ja: "" },
    status: "missing",
  },
];

export default function ProjectTranslationsRoute() {
  const { projectId } = useParams();
  const sourceLang = "en";
  const targetLangs = ["ko", "ja"];

  const [keys, setKeys] = useState<TranslationKey[]>(mockKeys);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(
    mockKeys[0]?.id ?? null
  );
  const [viewMode, setViewMode] = useState<"excel" | "csv">("excel");
  const [searchTerm, setSearchTerm] = useState("");

  const selectedKey = useMemo(
    () => keys.find((k) => k.id === selectedKeyId) ?? null,
    [keys, selectedKeyId]
  );

  // Always keep a selection when keys exist (avoid empty detail placeholder).
  useEffect(() => {
    if (!selectedKeyId && keys.length > 0) {
      setSelectedKeyId(keys[0].id);
    }
  }, [keys, selectedKeyId]);

  const filteredKeys = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return keys;
    return keys.filter(
      (k) =>
        k.key.toLowerCase().includes(term) ||
        k.context?.toLowerCase().includes(term) ||
        targetLangs.some((lang) =>
          (k.translations[lang] || "").toLowerCase().includes(term)
        )
    );
  }, [keys, searchTerm, targetLangs]);

  const handleUpdateTranslation = ({
    id,
    lang,
    value,
  }: {
    id: string;
    lang: string;
    value: string;
  }) => {
    setKeys((prev) =>
      prev.map((k) => {
        if (k.id !== id) return k;
        const nextTranslations = { ...k.translations, [lang]: value };
        const hasMissing = targetLangs.some(
          (t) => !(nextTranslations[t] ?? "").trim()
        );
        return {
          ...k,
          translations: nextTranslations,
          status: hasMissing ? "missing" : "translated",
        };
      })
    );
  };

  return (
    <DashboardLayout currentPath="projects">
      <div className="flex flex-col gap-4">
        <TranslationTopBar
          projectName={`Project ${projectId ?? ""}`}
          sourceLang={sourceLang}
          targetLangs={targetLangs}
          progress={64}
          onExport={() => console.log("Export")}
          onImport={() => console.log("Import")}
          onPreview={() => console.log("Preview JSON")}
        />

        <TranslationFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {viewMode === "csv" ? (
          <div className="border border-border rounded-md bg-background shadow-sm">
            <TranslationCsvEditor heightClass="h-[720px]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
            <div className="border border-border rounded-md bg-background shadow-sm">
              <TranslationTable
                keys={filteredKeys}
                sourceLang={sourceLang}
                targetLangs={targetLangs}
                selectedKeyId={selectedKeyId}
                onSelectKey={setSelectedKeyId}
                onUpdateTranslation={handleUpdateTranslation}
              />
            </div>

            <div className="border border-border rounded-md bg-background shadow-sm h-full min-h-[560px]">
              <TranslationDetailPanel
                selectedKey={selectedKey}
                onClose={() => {
                  // keep the first key selected to avoid empty placeholder
                  if (keys.length > 0) {
                    setSelectedKeyId(keys[0].id);
                  }
                }}
                targetLangs={targetLangs}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

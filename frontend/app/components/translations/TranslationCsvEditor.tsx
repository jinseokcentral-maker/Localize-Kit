import React from "react";
import { EditorSection } from "~/components/landing/editor/EditorSection";

interface TranslationCsvEditorProps {
  heightClass?: string;
}

/**
 * TranslationCsvEditor
 *
 * This is a thin wrapper around the existing landing-page EditorSection.
 * We intentionally copy it into the translations namespace so we can
 * iterate and specialize later (e.g., hooking project data, permissions,
 * inline save, etc.) without touching the landing experience.
 */
export function TranslationCsvEditor({
  heightClass,
}: TranslationCsvEditorProps) {
  return (
    <EditorSection
      heightClass={heightClass}
      paddingClass="p-0"
      renderControls={(node) => (
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/75 border-b border-border">
          {node}
        </div>
      )}
    />
  );
}

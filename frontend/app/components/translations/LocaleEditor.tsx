import { useEffect, useRef, useMemo } from "react";
import { VirtualTableDiv } from "localeeditor";
import "localeeditor/styles";
import type { TranslationKey } from "./TranslationTable";

interface LocaleEditorProps {
  keys: TranslationKey[];
  sourceLang: string;
  targetLangs: string[];
  onUpdateTranslation?: (params: {
    id: string;
    lang: string;
    value: string;
  }) => void;
}

/**
 * LocaleEditor component using VirtualTableDiv from localeeditor package
 *
 * This component wraps the VirtualTableDiv editor and handles data transformation
 * between our TranslationKey format and the format expected by VirtualTableDiv.
 */
export function LocaleEditor({
  keys,
  sourceLang,
  targetLangs,
  onUpdateTranslation,
}: LocaleEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<VirtualTableDiv | null>(null);
  const isInitializedRef = useRef(false);

  // Transform TranslationKey[] to the format expected by VirtualTableDiv
  // Use useMemo to prevent unnecessary recreations
  const translations = useMemo(
    () =>
      keys.map((key) => ({
        id: key.id,
        key: key.key,
        values: key.translations,
        context: key.context,
      })),
    [keys]
  );

  // Combine source and target languages
  const languages = useMemo(
    () => [sourceLang, ...targetLangs],
    [sourceLang, targetLangs]
  );
  const defaultLanguage = sourceLang;

  // Initialize editor only once
  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return;

    // Wait a bit to ensure container has proper dimensions
    const timeoutId = setTimeout(() => {
      if (!containerRef.current || isInitializedRef.current) return;

      try {
        // Initialize the editor with onCellChange callback for real-time updates
        editorRef.current = new VirtualTableDiv({
          container: containerRef.current,
          translations,
          languages,
          defaultLanguage,
          onCellChange: onUpdateTranslation
            ? (id: string, lang: string, value: string) => {
                // Call the callback to update parent state
                // The editor already has the updated value internally
                onUpdateTranslation({ id, lang, value });
              }
            : undefined,
        });

        // Explicitly call render to ensure the grid is displayed
        editorRef.current.render();
        isInitializedRef.current = true;
      } catch (error) {
        console.error("Failed to initialize VirtualTableDiv:", error);
      }
    }, 0);

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []); // Empty dependency array - initialize only once

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: "600px" }}
    />
  );
}

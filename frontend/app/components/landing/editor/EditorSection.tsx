import { useQueryState, parseAsStringLiteral, parseAsBoolean } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { Effect } from "effect";
import { cn } from "~/lib/utils";
import { CsvInputPanel } from "./CsvInputPanel";
import { JsonOutputPanel } from "./JsonOutputPanel";
import { EditorControls } from "./EditorControls";
import { useCsvStore } from "~/stores/csvStore";
import { useLoadWasmParser } from "~/hooks/useLoadWasmParser";
import { toast } from "sonner";
import {
  extractLanguages,
  resolveLanguageKey,
  getCurrentLanguage,
  formatJsonOutput,
  isExcelFile,
  isCsvFile,
  isValidFileType,
  type Separator,
} from "./utils/editorUtils";
import {
  parseCsvEffect,
  rewriteCsvSeparatorEffect,
  excelToCsvEffect,
  readFileAsArrayBufferEffect,
  readFileAsTextEffect,
  generateZipEffect,
} from "./utils/editorEffects";

export type OutputFormat = "json";
const OUTPUT_FORMATS = ["json"] as const;
const SEPARATORS = [".", "/", "-"] as const;

interface EditorSectionProps {
  /** Optional height utility classes (e.g., h-[720px]) for the editor area */
  heightClass?: string;
}

export function EditorSection({ heightClass }: EditorSectionProps) {
  const { csv: csvContent, setCsv } = useCsvStore();
  const wasmStatus = useLoadWasmParser();
  const [jsonOutput, setJsonOutput] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const uploadToastRef = useRef<number | null>(null);
  const parseRunIdRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);
  const [parsedLanguages, setParsedLanguages] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<"code" | "excel">("code");

  // URL query string으로 상태 관리
  const [outputFormat, setOutputFormat] = useQueryState(
    "format",
    parseAsStringLiteral(OUTPUT_FORMATS).withDefault("json")
  );
  const [nestedKeys, setNestedKeys] = useQueryState(
    "nested",
    parseAsBoolean.withDefault(true)
  );
  const [separator, setSeparator] = useQueryState(
    "sep",
    parseAsStringLiteral(SEPARATORS).withDefault(".")
  );
  const [activeLanguage, setActiveLanguage] = useQueryState("lang");

  // 언어 목록: WASM 파서 결과 우선, 없으면 헤더에서 추출
  const languages = parsedLanguages.length
    ? parsedLanguages
    : extractLanguages(csvContent);

  // 빈 문자열이면 첫 번째 파싱된 언어 사용. 조회용은 항상 소문자로 통일.
  const currentLanguage = getCurrentLanguage(activeLanguage, languages);

  const resolvedLanguageKey = resolveLanguageKey(
    currentLanguage,
    Object.keys(jsonOutput)
  );

  const currentJson = resolvedLanguageKey
    ? jsonOutput[resolvedLanguageKey]
    : {};

  // Body scroll lock for fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isFullscreen]);

  function parseAndSet(
    csv: string,
    {
      fromUpload = false,
      separatorOverride,
      nestedOverride,
    }: {
      fromUpload?: boolean;
      separatorOverride?: Separator;
      nestedOverride?: boolean;
    } = {}
  ) {
    if (wasmStatus !== "loaded") return;

    const runId = ++parseRunIdRef.current;

    const parseEffect = parseCsvEffect(csv, {
      separator: separatorOverride ?? separator,
      nested: nestedOverride ?? nestedKeys,
    });

    Effect.runPromise(parseEffect)
      .then((result) => {
        if (runId !== parseRunIdRef.current) return;

        setJsonOutput(result.data);
        setParsedLanguages(result.languages);
        setParseError(null);

        if (fromUpload || uploadToastRef.current !== null) {
          const durationMs = Math.round(
            performance.now() - (uploadToastRef.current ?? performance.now())
          );
          const rows = result.row_count ?? 0;
          toast.success(`${rows} rows converted in ${durationMs}ms.`);
          uploadToastRef.current = null;
        }
      })
      .catch((err) => {
        if (runId !== parseRunIdRef.current) return;

        setJsonOutput({});
        setParsedLanguages([]);
        setParseError(
          err instanceof Error ? err.message : "Failed to parse CSV"
        );
        console.warn("[Editor] parse error", err);
        uploadToastRef.current = null;
      });
  }

  function triggerParse(
    csv: string,
    {
      immediate = false,
      fromUpload = false,
      separatorOverride,
      nestedOverride,
    }: {
      immediate?: boolean;
      fromUpload?: boolean;
      separatorOverride?: Separator;
      nestedOverride?: boolean;
    } = {}
  ) {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (immediate) {
      parseAndSet(csv, { fromUpload, separatorOverride, nestedOverride });
      return;
    }

    debounceTimerRef.current = window.setTimeout(() => {
      parseAndSet(csv, { fromUpload, separatorOverride, nestedOverride });
    }, 400);
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const hasInitialParseRef = useRef(false);
  useEffect(() => {
    if (hasInitialParseRef.current) return;
    if (wasmStatus === "loaded") {
      hasInitialParseRef.current = true;

      Effect.runPromise(
        rewriteCsvSeparatorEffect(csvContent, separator).pipe(
          Effect.catchAll(() => Effect.succeed(csvContent))
        )
      ).then((rewritten) => {
        if (rewritten !== csvContent) {
          setCsv(rewritten);
        }
        triggerParse(rewritten, {
          immediate: true,
          separatorOverride: separator,
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasmStatus, csvContent, separator]);

  function handleSeparatorChange(sep: Separator | null) {
    if (!sep) return;
    setSeparator(sep);

    Effect.runPromise(
      rewriteCsvSeparatorEffect(csvContent, sep).pipe(
        Effect.catchAll(() => Effect.succeed(csvContent))
      )
    ).then((rewritten) => {
      setCsv(rewritten);
      triggerParse(rewritten, {
        immediate: true,
        separatorOverride: sep,
      });
    });
  }

  function handleNestedChange(value: boolean) {
    setNestedKeys(value);
    triggerParse(csvContent, {
      immediate: true,
      nestedOverride: value,
    });
  }

  function handleCsvChange(value: string) {
    setCsv(value);
    triggerParse(value);
  }

  // 파일 업로드 핸들러
  function handleFileUpload(file: File) {
    if (!isValidFileType(file.name)) {
      toast.error("Invalid file type. Please upload CSV or Excel.");
      return;
    }

    if (isExcelFile(file.name)) {
      if (wasmStatus !== "loaded") {
        toast.error("WASM not loaded yet. Please try again.");
        return;
      }

      const uploadEffect = Effect.gen(function* (_) {
        const buffer = yield* _(readFileAsArrayBufferEffect(file));
        const csvText = yield* _(excelToCsvEffect(new Uint8Array(buffer)));
        return csvText;
      });

      Effect.runPromise(
        uploadEffect.pipe(
          Effect.catchAll((err) => {
            toast.error("Failed to parse Excel file");
            console.error(err);
            return Effect.void;
          })
        )
      ).then((csvText) => {
        if (!csvText) return;

        setCsv(csvText);
        setActiveLanguage(null);
        uploadToastRef.current = performance.now();
        toast.success("Excel converted to CSV");
        triggerParse(csvText, { immediate: true, fromUpload: true });
      });
      return;
    }

    if (isCsvFile(file.name)) {
      Effect.runPromise(
        readFileAsTextEffect(file).pipe(
          Effect.catchAll((err) => {
            toast.error("Failed to read CSV file");
            console.error(err);
            return Effect.void;
          })
        )
      ).then((text) => {
        if (!text) return;

        setCsv(text);
        setActiveLanguage(null);
        uploadToastRef.current = performance.now();
        triggerParse(text, { immediate: true, fromUpload: true });
      });
      return;
    }
  }

  const formatted = formatJsonOutput(currentJson);

  // 복사 핸들러
  function handleCopy() {
    navigator.clipboard.writeText(formatted.text);
    toast.success("Copied output");
  }

  // 다운로드 핸들러
  function handleDownload() {
    const blob = new Blob([formatted.text], { type: formatted.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(resolvedLanguageKey || currentLanguage).toLowerCase()}.${
      formatted.ext
    }`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded current output");
  }

  // 전체 다운로드 핸들러
  function handleDownloadAll() {
    Effect.runPromise(
      generateZipEffect(jsonOutput).pipe(
        Effect.catchAll((err) => {
          toast.error("Failed to generate ZIP file");
          console.error(err);
          return Effect.void;
        })
      )
    ).then((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "i18n.zip";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded i18n.zip");
    });
  }

  return (
    <section className="px-8 py-12">
      <div
        className={cn(
          "bg-card border border-border rounded-[10px] overflow-hidden shadow-lg flex flex-col",
          heightClass
        )}
      >
        {/* Top Controls */}
        <EditorControls
          outputFormat={outputFormat}
          onOutputFormatChange={setOutputFormat}
          nestedKeys={nestedKeys}
          onNestedKeysChange={handleNestedChange}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onDownloadAll={handleDownloadAll}
        />

        {parseError && (
          <div className="px-4 py-3 border-b border-destructive/40 bg-destructive/10 text-destructive text-sm">
            {parseError}
          </div>
        )}

        {/* Main Editor Area */}
        <div
          className={cn(
            "grid grid-cols-2 overflow-hidden",
            heightClass ? "flex-1 min-h-0" : "min-h-[400px]"
          )}
        >
          {/* Left: CSV Input */}
          <div
            className={cn(
              "relative flex flex-col",
              isFullscreen
                ? "fixed inset-0 z-50 bg-background h-screen max-h-screen"
                : "relative"
            )}
          >
            <CsvInputPanel
              value={csvContent}
              onChange={handleCsvChange}
              onFileUpload={handleFileUpload}
              separator={separator}
              onSeparatorChange={handleSeparatorChange}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen((v) => !v)}
              viewMode={viewMode}
              onToggleViewMode={() =>
                setViewMode((v) => (v === "code" ? "excel" : "code"))
              }
            />
          </div>

          {/* Right: JSON Output */}
          {!isFullscreen && (
            <JsonOutputPanel
              languages={languages}
              activeLanguage={currentLanguage}
              onLanguageChange={setActiveLanguage}
              formattedText={formatted.text}
              filename={`${(
                resolvedLanguageKey || currentLanguage
              ).toLowerCase()}.${formatted.ext}`}
              format={outputFormat}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default EditorSection;

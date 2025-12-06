import { useQueryState, parseAsStringLiteral, parseAsBoolean } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { cn } from "~/lib/utils";
import { CsvInputPanel } from "./CsvInputPanel";
import { JsonOutputPanel } from "./JsonOutputPanel";
import { EditorControls } from "./EditorControls";
import { useCsvStore } from "~/stores/csvStore";
import {
  parseCsvString,
  rewriteCsvKeySeparator,
  excelToCsv,
} from "~/lib/parser/index";
import { logTimed } from "~/lib/logger";
import { useLoadWasmParser } from "~/hooks/useLoadWasmParser";
import { toast } from "sonner";
import JSZip from "jszip";

// 샘플 데이터 (중첩 키 예시 포함)
const SAMPLE_CSV = `key,en,ko,ja
common.hello,Hello,안녕하세요,こんにちは
common.goodbye,Goodbye,안녕히 가세요,さようなら
common.welcome,Welcome,환영합니다,ようこそ
auth.login,Login,로그인,ログイン
auth.logout,Logout,로그아웃,ログアウト
auth.signup,Sign up,회원가입,新規登録
errors.notFound,Page not found,페이지를 찾을 수 없습니다,ページが見つかりません
errors.serverError,Server error,서버 오류,サーバーエラー`;

// 언어 코드 추출
function extractLanguages(csv: string): string[] {
  const firstLine = csv.trim().split("\n")[0];
  if (!firstLine) return [];

  const headers = firstLine.split(",").map((h) => h.trim());
  return headers.filter((h) => h.toLowerCase() !== "key").map((h) => h); // 원본 케이스 유지
}

export type OutputFormat = "json";
export type Separator = "." | "/" | "-";
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
  const [parsedLanguages, setParsedLanguages] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // URL query string으로 상태 관리
  const [outputFormat, setOutputFormat] = useQueryState(
    "format",
    parseAsStringLiteral(OUTPUT_FORMATS).withDefault("json")
  );
  const [nestedKeys, setNestedKeys] = useQueryState(
    "nested",
    parseAsBoolean.withDefault(false)
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
  const currentLanguageRaw = activeLanguage || languages[0] || "en";
  const currentLanguage = currentLanguageRaw.toLowerCase();

  // 언어 키를 대소문자/구분자 무시하고 매칭
  const resolvedLanguageKey = useMemo(() => {
    const target = currentLanguage.toLowerCase().replace("_", "-");
    return Object.keys(jsonOutput).find((key) => {
      const normalized = key.toLowerCase().replace("_", "-");
      return normalized === target;
    });
  }, [currentLanguage, jsonOutput]);

  // 현재 선택된 언어의 JSON
  const currentJson = resolvedLanguageKey
    ? jsonOutput[resolvedLanguageKey]
    : {};

  // Separator 변경 시 키 컬럼을 새 구분자로 변환
  useEffect(() => {
    if (wasmStatus !== "loaded") return;
    const rewritten = rewriteCsvKeySeparator(csvContent, separator);
    if (rewritten !== csvContent) {
      setCsv(rewritten);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [separator, wasmStatus]);

  // CSV 파싱 (WASM) - async
  useEffect(() => {
    if (wasmStatus !== "loaded") return;
    let cancelled = false;
    const run = async () => {
      const start = performance.now();
      try {
        const result = await parseCsvString(csvContent, {
          separator,
          nested: nestedKeys,
        });
        if (cancelled) return;
        setJsonOutput(result.data ?? {});
        setParsedLanguages(result.languages || []);
        setParseError(null);
        const end = performance.now();
        logTimed("Parse CSV", end - start);
      } catch (err) {
        if (cancelled) return;
        setJsonOutput({});
        setParsedLanguages([]);
        setParseError(
          err instanceof Error ? err.message : "Failed to parse CSV"
        );
        console.warn("[Editor] parse error", err);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [csvContent, separator, nestedKeys, wasmStatus, outputFormat]);

  // 파일 업로드 핸들러
  const handleFileUpload = (file: File) => {
    const name = file.name.toLowerCase();
    const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");
    const isCsv = name.endsWith(".csv");

    if (!isExcel && !isCsv) {
      toast.error("Invalid file type. Please upload CSV or Excel.");
      return;
    }

    if (isExcel) {
      if (wasmStatus !== "loaded") {
        toast.error("WASM not loaded yet. Please try again.");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const csvText = await excelToCsv(new Uint8Array(buffer));
          setCsv(csvText);
          setActiveLanguage(null);
          toast.success("Excel converted to CSV");
        } catch (err) {
          toast.error("Failed to parse Excel file");
          console.error(err);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    if (isCsv) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setCsv(text);
          setActiveLanguage(null);
        }
      };
      reader.readAsText(file);
      return;
    }
  };

  const formatted = useMemo(() => {
    return {
      text: JSON.stringify(currentJson, null, 2),
      ext: "json",
      mime: "application/json",
    };
  }, [currentJson]);

  // 복사 핸들러
  const handleCopy = () => {
    navigator.clipboard.writeText(formatted.text);
    toast.success("Copied output");
  };

  // 다운로드 핸들러
  const handleDownload = () => {
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
  };

  // 전체 다운로드 핸들러
  const handleDownloadAll = async () => {
    const zip = new JSZip();
    Object.entries(jsonOutput).forEach(([lang, data]) => {
      const jsonString = JSON.stringify(data, null, 2);
      zip.file(`${lang.toLowerCase()}.json`, jsonString);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "i18n.zip";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded i18n.zip");
  };

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
          onNestedKeysChange={setNestedKeys}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onDownloadAll={handleDownloadAll}
        />

        {/* Main Editor Area */}
        <div
          className={cn(
            "grid grid-cols-2 overflow-hidden",
            heightClass ? "flex-1 min-h-0" : "min-h-[400px]"
          )}
        >
          {/* Left: CSV Input */}
          <CsvInputPanel
            value={csvContent}
            onChange={setCsv}
            onFileUpload={handleFileUpload}
            separator={separator}
            onSeparatorChange={setSeparator}
          />

          {/* Right: JSON Output */}
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
        </div>
      </div>
    </section>
  );
}

export default EditorSection;

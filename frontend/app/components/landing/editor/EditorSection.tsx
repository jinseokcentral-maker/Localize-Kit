import { useQueryState, parseAsStringLiteral, parseAsBoolean } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { CsvInputPanel } from "./CsvInputPanel";
import { JsonOutputPanel } from "./JsonOutputPanel";
import { EditorControls } from "./EditorControls";
import { useCsvStore } from "~/stores/csvStore";
import { parseCsvString, rewriteCsvKeySeparator } from "~/lib/parser/index";
import { logTimed } from "~/lib/logger";
import { useLoadWasmParser } from "~/hooks/useLoadWasmParser";

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

export function EditorSection() {
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

  // 현재 선택된 언어의 JSON
  const currentJson = jsonOutput[currentLanguage] || {};

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
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setCsv(text);
        // lang을 null로 설정하면 URL에서 제거되고, 첫 번째 언어가 자동 선택됨
        setActiveLanguage(null);
      }
    };
    reader.readAsText(file);
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
  };

  // 다운로드 핸들러
  const handleDownload = () => {
    const blob = new Blob([formatted.text], { type: formatted.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentLanguage.toLowerCase()}.${formatted.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 전체 다운로드 핸들러
  const handleDownloadAll = () => {
    // JSON 모드: 언어별 개별 다운로드
    Object.entries(jsonOutput).forEach(([lang, data]) => {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${lang.toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <section className="px-8 py-12">
      <div className="bg-card border border-border rounded-[10px] overflow-hidden shadow-lg">
        {/* Main Editor Area */}
        <div className="grid grid-cols-2 min-h-[400px]">
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
            filename={`${currentLanguage}.${formatted.ext}`}
            format={outputFormat}
          />
        </div>

        {/* Bottom Controls */}
        <EditorControls
          outputFormat={outputFormat}
          onOutputFormatChange={setOutputFormat}
          nestedKeys={nestedKeys}
          onNestedKeysChange={setNestedKeys}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onDownloadAll={handleDownloadAll}
        />
      </div>
    </section>
  );
}

export default EditorSection;

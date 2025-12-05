import { useState, useCallback } from "react";
import { useQueryState, parseAsStringLiteral, parseAsBoolean } from "nuqs";
import { CsvInputPanel } from "./CsvInputPanel";
import { JsonOutputPanel } from "./JsonOutputPanel";
import { EditorControls } from "./EditorControls";

// 샘플 데이터
const SAMPLE_CSV = `key,en,ko,ja
hello,Hello,안녕하세요,こんにちは
goodbye,Goodbye,안녕히 가세요,さようなら
welcome,Welcome,환영합니다,ようこそ
thank_you,Thank you,감사합니다,ありがとう`;

// CSV를 파싱해서 언어별 JSON으로 변환 (임시 로직)
function parseCsvToJson(csv: string, nested: boolean): Record<string, Record<string, string>> {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return {};

  const headers = lines[0].split(",").map((h) => h.trim());
  const keyIndex = headers.findIndex((h) => h.toLowerCase() === "key");
  const langHeaders = headers.filter((_, i) => i !== keyIndex);

  const result: Record<string, Record<string, string>> = {};
  langHeaders.forEach((lang) => {
    result[lang.toUpperCase()] = {};
  });

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const key = values[keyIndex]?.trim();
    if (!key) continue;

    langHeaders.forEach((lang, langIdx) => {
      const valueIndex = headers.indexOf(lang);
      const value = values[valueIndex]?.trim() || "";
      const langKey = lang.toUpperCase();

      if (nested && key.includes(".")) {
        // Nested key 처리 (예: auth.login -> { auth: { login: value } })
        const parts = key.split(".");
        let current = result[langKey];
        for (let j = 0; j < parts.length - 1; j++) {
          if (!current[parts[j]]) {
            current[parts[j]] = {} as any;
          }
          current = current[parts[j]] as any;
        }
        current[parts[parts.length - 1]] = value;
      } else {
        result[langKey][key] = value;
      }
    });
  }

  return result;
}

// 언어 코드 추출
function extractLanguages(csv: string): string[] {
  const firstLine = csv.trim().split("\n")[0];
  if (!firstLine) return [];
  
  const headers = firstLine.split(",").map((h) => h.trim());
  return headers
    .filter((h) => h.toLowerCase() !== "key")
    .map((h) => h.toUpperCase());
}

export type OutputFormat = "json" | "yaml" | "i18n";
const OUTPUT_FORMATS = ["json", "yaml", "i18n"] as const;

export function EditorSection() {
  const [csvContent, setCsvContent] = useState(SAMPLE_CSV);
  
  // URL query string으로 상태 관리
  const [outputFormat, setOutputFormat] = useQueryState(
    "format",
    parseAsStringLiteral(OUTPUT_FORMATS).withDefault("json")
  );
  const [nestedKeys, setNestedKeys] = useQueryState(
    "nested",
    parseAsBoolean.withDefault(false)
  );
  const [activeLanguage, setActiveLanguage] = useQueryState("lang");

  // 언어 목록 추출
  const languages = extractLanguages(csvContent);
  
  // 빈 문자열이면 첫 번째 파싱된 언어 사용
  const currentLanguage = activeLanguage || languages[0] || "EN";

  // CSV를 JSON으로 변환
  const jsonOutput = parseCsvToJson(csvContent, nestedKeys);

  // 현재 선택된 언어의 JSON
  const currentJson = jsonOutput[currentLanguage] || {};

  // 파일 업로드 핸들러
  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setCsvContent(text);
        // lang을 null로 설정하면 URL에서 제거되고, 첫 번째 언어가 자동 선택됨
        setActiveLanguage(null);
      }
    };
    reader.readAsText(file);
  }, [setActiveLanguage]);

  // 복사 핸들러
  const handleCopy = useCallback(() => {
    const jsonString = JSON.stringify(currentJson, null, 2);
    navigator.clipboard.writeText(jsonString);
  }, [currentJson]);

  // 다운로드 핸들러
  const handleDownload = useCallback(() => {
    const jsonString = JSON.stringify(currentJson, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentLanguage.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentJson, currentLanguage]);

  // 전체 다운로드 핸들러
  const handleDownloadAll = useCallback(() => {
    // 각 언어별 파일을 ZIP으로 묶어서 다운로드 (추후 구현)
    // 지금은 개별 다운로드
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
  }, [jsonOutput]);

  return (
    <section className="px-8 py-12">
      <div className="bg-card border border-border rounded-[10px] overflow-hidden shadow-lg">
        {/* Main Editor Area */}
        <div className="grid grid-cols-2 min-h-[400px]">
          {/* Left: CSV Input */}
          <CsvInputPanel
            value={csvContent}
            onChange={setCsvContent}
            onFileUpload={handleFileUpload}
          />

          {/* Right: JSON Output */}
          <JsonOutputPanel
            languages={languages}
            activeLanguage={currentLanguage}
            onLanguageChange={setActiveLanguage}
            jsonData={currentJson}
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


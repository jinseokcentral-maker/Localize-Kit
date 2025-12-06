import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { TypoSmall } from "~/components/typo";
import { jsonOutputTheme, jsonHighlighting } from "./csvHighlight";

interface JsonOutputPanelProps {
  languages: string[];
  activeLanguage: string;
  onLanguageChange: (lang: string) => void;
  formattedText: string;
  filename: string;
  format: "json";
}

export function JsonOutputPanel({
  languages,
  activeLanguage,
  onLanguageChange,
  formattedText,
  filename,
  format,
}: JsonOutputPanelProps) {
  const current = activeLanguage.toLowerCase();
  const isJson = format === "json";

  return (
    <div className="flex flex-col">
      {/* Language Tabs */}
      <div className="flex items-center gap-1 px-4 h-14 border-b border-border overflow-x-auto">
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => onLanguageChange(lang.toLowerCase())}
            className={`px-3 py-1.5 text-sm rounded transition-colors whitespace-nowrap ${
              current === lang.toLowerCase()
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      {/* JSON Output */}
      <div className="flex-1 overflow-auto relative">
        {/* File comment */}
        <div className="px-4 pt-4">
          <TypoSmall className="text-muted-foreground font-mono">
            // {filename}
          </TypoSmall>
        </div>

        <CodeMirror
          value={formattedText}
          readOnly
          theme={jsonOutputTheme}
          extensions={isJson ? [json(), jsonHighlighting] : []}
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: false,
            highlightSelectionMatches: false,
          }}
          className="h-full font-mono text-sm"
          style={{
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}

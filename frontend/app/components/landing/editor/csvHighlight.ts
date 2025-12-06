import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { StreamLanguage } from "@codemirror/language";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Tag, tags as t } from "@lezer/highlight";

// Rainbow CSV 색상 팔레트 (열별로 다른 색상)
const RAINBOW_COLORS = [
  "#f59e0b", // amber-500 (key)
  "#22c55e", // green-500
  "#3b82f6", // blue-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
];

// CSV 언어 정의 (간단한 버전)
const csvParser = {
  startState() {
    return { col: 0 };
  },
  token(stream: any, state: { col: number }) {
    // 줄의 시작에서 열 초기화
    if (stream.sol()) {
      state.col = 0;
    }

    // 쉼표 처리
    if (stream.eat(",")) {
      state.col++;
      return null;
    }

    // 따옴표로 묶인 필드
    if (stream.peek() === '"') {
      stream.next();
      while (!stream.eol()) {
        if (stream.next() === '"') {
          if (stream.peek() !== '"') break;
          stream.next();
        }
      }
      return `csv-col-${state.col % 8}`;
    }

    // 일반 필드 (쉼표나 줄 끝까지)
    let hasContent = false;
    while (!stream.eol() && stream.peek() !== ",") {
      stream.next();
      hasContent = true;
    }

    if (hasContent) {
      return `csv-col-${state.col % 8}`;
    }

    stream.next();
    return null;
  },
};

// Highlight tags & styles for rainbow columns (avoid console warnings)
const csvTags: Tag[] = Array.from({ length: 8 }, () => Tag.define());
const csvTokenTable = Object.fromEntries(
  csvTags.map((tag, idx) => [`csv-col-${idx}`, tag])
);

const csvLanguage = StreamLanguage.define({
  ...csvParser,
  tokenTable: csvTokenTable,
});

const csvHighlightStyle = HighlightStyle.define(
  csvTags.map((tag, idx) => ({
    tag,
    class: `cm-csv-col-${idx}`,
  }))
);

// CSV Rainbow 테마
export const csvRainbowTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "transparent",
      height: "100%",
    },
    ".cm-content": {
      padding: "16px",
      fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
      fontSize: "14px",
      lineHeight: "1.625",
    },
    ".cm-line": {
      padding: "0",
    },
    ".cm-gutters": {
      display: "none",
    },
    ".cm-focused": {
      outline: "none",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
    // Rainbow 열 색상
    ".cm-csv-col-0": { color: RAINBOW_COLORS[0] },
    ".cm-csv-col-1": { color: RAINBOW_COLORS[1] },
    ".cm-csv-col-2": { color: RAINBOW_COLORS[2] },
    ".cm-csv-col-3": { color: RAINBOW_COLORS[3] },
    ".cm-csv-col-4": { color: RAINBOW_COLORS[4] },
    ".cm-csv-col-5": { color: RAINBOW_COLORS[5] },
    ".cm-csv-col-6": { color: RAINBOW_COLORS[6] },
    ".cm-csv-col-7": { color: RAINBOW_COLORS[7] },
  },
  { dark: true }
);

// CSV Rainbow 하이라이팅 extension
export function csvRainbowHighlight(): Extension {
  return [csvLanguage, syntaxHighlighting(csvHighlightStyle)];
}

// JSON Output 테마 (읽기 전용, 다크 기준)
export const jsonOutputTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "transparent",
      height: "100%",
    },
    ".cm-content": {
      padding: "8px 16px 16px 16px",
      fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
      fontSize: "14px",
      lineHeight: "1.625",
    },
    ".cm-line": {
      padding: "0",
    },
    ".cm-gutters": {
      display: "none",
    },
    ".cm-focused": {
      outline: "none",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
    // Dark-mode palette
    ".tok-string, .cm-string": { color: "#5eead4" }, // teal-300
    ".tok-number, .cm-number": { color: "#fcd34d" }, // amber-300
    ".tok-bool, .cm-boolean": { color: "#c084fc" }, // purple-300
    ".tok-null, .cm-null": { color: "#9ca3af" }, // gray-400
    ".tok-propertyName, .cm-property": { color: "#93c5fd" }, // blue-300
    ".tok-punctuation, .cm-punctuation": { color: "#d1d5db" }, // gray-300
    "&.cm-focused .cm-cursor": {
      display: "none",
    },
    ".cm-selectionBackground": {
      backgroundColor: "rgba(59, 130, 246, 0.3)",
    },
  },
  { dark: true }
);

// JSON 전용 하이라이트 (기본 스트링 빨강 오버라이드)
const jsonHighlightStyle = HighlightStyle.define([
  { tag: t.string, color: "#5eead4" }, // teal-300
  { tag: t.number, color: "#fcd34d" }, // amber-300
  { tag: t.bool, color: "#c084fc" }, // purple-300
  { tag: t.null, color: "#9ca3af" }, // gray-400
  { tag: t.propertyName, color: "#93c5fd" }, // blue-300
  { tag: t.punctuation, color: "#d1d5db" }, // gray-300
]);

export const jsonHighlighting = syntaxHighlighting(jsonHighlightStyle);

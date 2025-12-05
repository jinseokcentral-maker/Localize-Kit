import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { StreamLanguage } from "@codemirror/language";

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

const csvLanguage = StreamLanguage.define(csvParser);

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
    ".tok-csv-col-0": { color: RAINBOW_COLORS[0] },
    ".tok-csv-col-1": { color: RAINBOW_COLORS[1] },
    ".tok-csv-col-2": { color: RAINBOW_COLORS[2] },
    ".tok-csv-col-3": { color: RAINBOW_COLORS[3] },
    ".tok-csv-col-4": { color: RAINBOW_COLORS[4] },
    ".tok-csv-col-5": { color: RAINBOW_COLORS[5] },
    ".tok-csv-col-6": { color: RAINBOW_COLORS[6] },
    ".tok-csv-col-7": { color: RAINBOW_COLORS[7] },
  },
  { dark: true }
);

// CSV Rainbow 하이라이팅 extension
export function csvRainbowHighlight(): Extension {
  return csvLanguage;
}

// JSON Output 테마 (읽기 전용)
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
    // JSON syntax 색상
    ".tok-string": { color: "#22c55e" },
    ".tok-number": { color: "#f59e0b" },
    ".tok-bool": { color: "#a855f7" },
    ".tok-null": { color: "#6b7280" },
    ".tok-propertyName": { color: "#3b82f6" },
    ".tok-punctuation": { color: "#e4e4e4" },
    // 커서 숨기기 (읽기 전용)
    "&.cm-focused .cm-cursor": {
      display: "none",
    },
    ".cm-selectionBackground": {
      backgroundColor: "rgba(59, 130, 246, 0.3)",
    },
  },
  { dark: true }
);

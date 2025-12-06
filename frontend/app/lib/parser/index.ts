/**
 * WASM 기반 고성능 CSV/Excel 파서
 *
 * 사용법:
 * ```typescript
 * import { parseFile, parseCsv, parseExcel } from '@/app/lib/parser';
 *
 * try {
 *   const result = await parseFile(file, { nested: true });
 *   console.log(result.languages); // ['en', 'ko', 'ja']
 *   console.log(result.data);      // { en: {...}, ko: {...}, ja: {...} }
 * } catch (error) {
 *   if (error instanceof ParseError) {
 *     console.error(error.kind);       // 'INVALID_KEY_COLUMN'
 *     console.error(error.message);    // 'Invalid header: first column...'
 *     console.error(error.suggestion); // 'Rename the first column...'
 *   }
 * }
 * ```
 */

import init, {
  parse_csv,
  parse_excel,
  get_csv_languages,
  get_excel_languages,
  rewrite_csv_key_separator,
} from "./parsing.js";

let wasmInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * WASM 초기화 (자동으로 호출됨, 수동 호출도 가능)
 */
export async function initWasm(): Promise<void> {
  if (wasmInitialized) return;

  if (!initPromise) {
    initPromise = init().then(() => {
      wasmInitialized = true;
    });
  }

  await initPromise;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * 에러 위치 정보
 */
export interface ErrorLocation {
  /** 행 번호 (1-based) */
  row?: number;
  /** 컬럼 번호 (1-based) */
  column?: number;
  /** 컬럼 이름 (언어 코드) */
  columnName?: string;
  /** 키 이름 */
  key?: string;
}

/**
 * 에러 종류
 */
export type ErrorKind =
  | "EMPTY_DATA"
  | "INVALID_KEY_COLUMN"
  | "NO_LANGUAGE_COLUMNS"
  | "CSV_PARSE_ERROR"
  | "UTF8_ERROR"
  | "EXCEL_OPEN_ERROR"
  | "EMPTY_WORKBOOK"
  | "EMPTY_SHEET"
  | "WORKSHEET_READ_ERROR"
  | "DUPLICATE_KEY"
  | "INVALID_KEY_FORMAT"
  | "MISSING_TRANSLATION"
  | "NESTED_KEY_CONFLICT"
  | "JSON_SERIALIZE_ERROR"
  | "IO_ERROR"
  | "UNKNOWN_ERROR";

/**
 * 파싱 에러
 */
export class ParseError extends Error {
  /** 에러 종류 */
  readonly kind: ErrorKind;
  /** 에러 위치 */
  readonly location?: ErrorLocation;
  /** 해결 제안 */
  readonly suggestion?: string;
  /** 전체 에러 메시지 */
  readonly fullMessage: string;

  constructor(data: {
    kind: ErrorKind;
    message: string;
    location?: ErrorLocation;
    suggestion?: string;
    fullMessage: string;
  }) {
    super(data.message);
    this.name = "ParseError";
    this.kind = data.kind;
    this.location = data.location;
    this.suggestion = data.suggestion;
    this.fullMessage = data.fullMessage;
  }

  /**
   * JSON 문자열에서 ParseError 생성
   */
  static fromJson(json: string): ParseError {
    const data = JSON.parse(json);
    return new ParseError({
      kind: data.kind as ErrorKind,
      message: data.message,
      location: data.location || undefined,
      suggestion: data.suggestion || undefined,
      fullMessage: data.fullMessage,
    });
  }

  /**
   * 에러인지 확인
   */
  static isErrorJson(json: string): boolean {
    try {
      const data = JSON.parse(json);
      return data.error === true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * 파싱 결과 타입
 */
export interface ParseResult {
  /** 발견된 언어 목록 */
  languages: string[];
  /** 언어별 번역 데이터 */
  data: Record<string, Record<string, unknown>>;
  /** 파싱된 행 수 */
  row_count: number;
}

/**
 * 파싱 옵션
 */
export interface ParseOptions {
  /** 키 구분자 (기본값: ".") */
  separator?: "." | "/" | "-";
  /** nested object로 변환 여부 (기본값: true) */
  nested?: boolean;
  /** escape 시퀀스 처리 여부 (기본값: true) */
  processEscapes?: boolean;
}

// ============================================================================
// Helper function
// ============================================================================

function handleResult(resultJson: string): ParseResult {
  // Check if it's an error response
  if (ParseError.isErrorJson(resultJson)) {
    throw ParseError.fromJson(resultJson);
  }
  return JSON.parse(resultJson);
}

function handleError(error: unknown): never {
  if (typeof error === "string") {
    // WASM returns error as string
    if (ParseError.isErrorJson(error)) {
      throw ParseError.fromJson(error);
    }
    throw new Error(error);
  }
  throw error;
}

// ============================================================================
// Main API
// ============================================================================

/**
 * CSV 파일 파싱
 *
 * @throws {ParseError} 파싱 실패 시
 */
export async function parseCsv(
  file: File | Uint8Array,
  options: ParseOptions = {}
): Promise<ParseResult> {
  await initWasm();

  const { separator = ".", nested = true, processEscapes = true } = options;

  const data =
    file instanceof File ? new Uint8Array(await file.arrayBuffer()) : file;

  try {
    const resultJson = parse_csv(data, separator, nested, processEscapes);
    return handleResult(resultJson);
  } catch (error) {
    handleError(error);
  }
}

/**
 * Excel 파일 파싱 (.xlsx, .xls)
 *
 * @throws {ParseError} 파싱 실패 시
 */
export async function parseExcel(
  file: File | Uint8Array,
  options: ParseOptions = {}
): Promise<ParseResult> {
  await initWasm();

  const { separator = ".", nested = true, processEscapes = true } = options;

  const data =
    file instanceof File ? new Uint8Array(await file.arrayBuffer()) : file;

  try {
    const resultJson = parse_excel(data, separator, nested, processEscapes);
    return handleResult(resultJson);
  } catch (error) {
    handleError(error);
  }
}

/**
 * 파일 타입에 따라 자동으로 파서 선택
 *
 * @throws {ParseError} 파싱 실패 시
 */
export async function parseFile(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const fileName = file.name.toLowerCase();
  const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

  return isExcel ? parseExcel(file, options) : parseCsv(file, options);
}

/**
 * CSV 문자열 파싱
 *
 * @throws {ParseError} 파싱 실패 시
 */
export async function parseCsvString(
  csvString: string,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const encoder = new TextEncoder();
  const data = encoder.encode(csvString);
  return parseCsv(data, options);
}

/**
 * CSV에서 언어 목록만 빠르게 추출
 *
 * @throws {ParseError} 파싱 실패 시
 */
export async function getCsvLanguages(
  file: File | Uint8Array
): Promise<string[]> {
  await initWasm();

  const data =
    file instanceof File ? new Uint8Array(await file.arrayBuffer()) : file;

  try {
    const resultJson = get_csv_languages(data);
    if (ParseError.isErrorJson(resultJson)) {
      throw ParseError.fromJson(resultJson);
    }
    return JSON.parse(resultJson);
  } catch (error) {
    handleError(error);
  }
}

/**
 * Excel에서 언어 목록만 빠르게 추출
 *
 * @throws {ParseError} 파싱 실패 시
 */
export async function getExcelLanguages(
  file: File | Uint8Array
): Promise<string[]> {
  await initWasm();

  const data =
    file instanceof File ? new Uint8Array(await file.arrayBuffer()) : file;

  try {
    const resultJson = get_excel_languages(data);
    if (ParseError.isErrorJson(resultJson)) {
      throw ParseError.fromJson(resultJson);
    }
    return JSON.parse(resultJson);
  } catch (error) {
    handleError(error);
  }
}

/**
 * 파일에서 언어 목록만 빠르게 추출 (자동 감지)
 *
 * @throws {ParseError} 파싱 실패 시
 */
export async function getLanguages(file: File): Promise<string[]> {
  const fileName = file.name.toLowerCase();
  const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

  return isExcel ? getExcelLanguages(file) : getCsvLanguages(file);
}

// ============================================================================
// Utility: key separator rewrite
// ============================================================================

/**
 * Rewrite key separator in CSV text.
 * - Only the first column (key) is rewritten; header is preserved.
 * - Replaces '.', '/', '-' with the provided separator.
 */
export function rewriteCsvKeySeparator(
  csvText: string,
  separator: string
): string {
  return rewrite_csv_key_separator(csvText, separator);
}

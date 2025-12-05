/**
 * WASM 기반 고성능 CSV/Excel 파서
 *
 * 사용법:
 * ```typescript
 * import { parseFile, parseCsv, parseExcel } from '@/app/lib/parser';
 *
 * const result = await parseFile(file, { nested: true });
 * console.log(result.languages); // ['en', 'ko', 'ja']
 * console.log(result.data);      // { en: {...}, ko: {...}, ja: {...} }
 * ```
 */

import init, {
  parse_csv,
  parse_excel,
  get_csv_languages,
  get_excel_languages,
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

/**
 * CSV 파일 파싱
 */
export async function parseCsv(
  file: File | Uint8Array,
  options: ParseOptions = {}
): Promise<ParseResult> {
  await initWasm();

  const { separator = ".", nested = true, processEscapes = true } = options;

  const data =
    file instanceof File ? new Uint8Array(await file.arrayBuffer()) : file;

  const resultJson = parse_csv(data, separator, nested, processEscapes);
  return JSON.parse(resultJson);
}

/**
 * Excel 파일 파싱 (.xlsx, .xls)
 */
export async function parseExcel(
  file: File | Uint8Array,
  options: ParseOptions = {}
): Promise<ParseResult> {
  await initWasm();

  const { separator = ".", nested = true, processEscapes = true } = options;

  const data =
    file instanceof File ? new Uint8Array(await file.arrayBuffer()) : file;

  const resultJson = parse_excel(data, separator, nested, processEscapes);
  return JSON.parse(resultJson);
}

/**
 * 파일 타입에 따라 자동으로 파서 선택
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
 */
export async function getCsvLanguages(
  file: File | Uint8Array
): Promise<string[]> {
  await initWasm();

  const data =
    file instanceof File ? new Uint8Array(await file.arrayBuffer()) : file;

  const resultJson = get_csv_languages(data);
  return JSON.parse(resultJson);
}

/**
 * Excel에서 언어 목록만 빠르게 추출
 */
export async function getExcelLanguages(
  file: File | Uint8Array
): Promise<string[]> {
  await initWasm();

  const data =
    file instanceof File ? new Uint8Array(await file.arrayBuffer()) : file;

  const resultJson = get_excel_languages(data);
  return JSON.parse(resultJson);
}

/**
 * 파일에서 언어 목록만 빠르게 추출 (자동 감지)
 */
export async function getLanguages(file: File): Promise<string[]> {
  const fileName = file.name.toLowerCase();
  const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

  return isExcel ? getExcelLanguages(file) : getCsvLanguages(file);
}

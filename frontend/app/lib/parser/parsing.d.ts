/* tslint:disable */
/* eslint-disable */

/**
 * Excel -> CSV 변환 (첫 번째 시트)
 */
export function excel_to_csv(data: Uint8Array): string;

/**
 * CSV 헤더만 파싱하여 언어 목록 반환 - WASM 바인딩
 */
export function get_csv_languages(data: Uint8Array): string;

/**
 * Excel 헤더만 파싱하여 언어 목록 반환 - WASM 바인딩
 */
export function get_excel_languages(data: Uint8Array): string;

/**
 * WASM 모듈 초기화
 */
export function init(): void;

/**
 * CSV 파싱 - WASM 바인딩
 *
 * # Arguments
 * * `data` - CSV 파일 바이트 데이터
 * * `separator` - 키 구분자 (".", "/", "-")
 * * `nested` - nested object로 변환 여부
 * * `process_escapes` - escape 시퀀스 처리 여부 (\n, \t 등)
 *
 * # Returns
 * JSON string with parsed data or error details
 */
export function parse_csv(data: Uint8Array, separator: string, nested: boolean, process_escapes: boolean): string;

/**
 * CSV 파싱 - YAML 출력
 */
export function parse_csv_yaml(data: Uint8Array, separator: string, nested: boolean, process_escapes: boolean): string;

/**
 * Excel 파싱 - WASM 바인딩
 *
 * # Arguments
 * * `data` - Excel 파일 바이트 데이터
 * * `separator` - 키 구분자 (".", "/", "-")
 * * `nested` - nested object로 변환 여부
 * * `process_escapes` - escape 시퀀스 처리 여부 (\n, \t 등)
 *
 * # Returns
 * JSON string with parsed data or error details
 */
export function parse_excel(data: Uint8Array, separator: string, nested: boolean, process_escapes: boolean): string;

/**
 * Excel 파싱 - YAML 출력
 */
export function parse_excel_yaml(data: Uint8Array, separator: string, nested: boolean, process_escapes: boolean): string;

/**
 * Rewrite key separator in CSV text (header is kept as-is).
 * Replaces '.', '/', '-' in the first column (key) with `target_sep`.
 */
export function rewrite_csv_key_separator(csv_text: string, target_sep: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly excel_to_csv: (a: number, b: number, c: number) => void;
  readonly get_csv_languages: (a: number, b: number, c: number) => void;
  readonly get_excel_languages: (a: number, b: number, c: number) => void;
  readonly parse_csv: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly parse_csv_yaml: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly parse_excel: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly parse_excel_yaml: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly rewrite_csv_key_separator: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly init: () => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export: (a: number, b: number) => number;
  readonly __wbindgen_export2: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export3: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

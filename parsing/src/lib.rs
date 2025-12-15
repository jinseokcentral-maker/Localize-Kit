pub mod error;
pub mod lang_codes;
pub mod parser;
pub mod export;
pub mod transform;
pub mod types;

#[cfg(test)]
mod bench;

use wasm_bindgen::prelude::*;

use crate::error::{ErrorKind, ParseError};
use crate::types::{OutputFormat, ParseOptions, ParseResult};

fn serialize_result(result: &ParseResult, format: OutputFormat) -> std::result::Result<String, ParseError> {
    match format {
        OutputFormat::Json => serde_json::to_string(result).map_err(ParseError::json_serialize_error),
        OutputFormat::Yaml => serde_yaml::to_string(result).map_err(ParseError::yaml_serialize_error),
        OutputFormat::I18n => Err(ParseError::new(
            ErrorKind::Unknown,
            "i18n format is not implemented yet",
        )),
    }
}

/// WASM 모듈 초기화
#[wasm_bindgen(start)]
pub fn init() {
    // 초기화 로직 (필요 시 추가)
}

/// CSV 파싱 - WASM 바인딩
///
/// # Arguments
/// * `data` - CSV 파일 바이트 데이터
/// * `separator` - 키 구분자 (".", "/", "-")
/// * `nested` - nested object로 변환 여부
/// * `process_escapes` - escape 시퀀스 처리 여부 (\n, \t 등)
///
/// # Returns
/// JSON string with parsed data or error details
#[wasm_bindgen]
pub fn parse_csv(
    data: &[u8],
    separator: &str,
    nested: bool,
    process_escapes: bool,
) -> Result<String, JsValue> {
    let options = ParseOptions {
        separator: separator.to_string(),
        nested,
        output_format: OutputFormat::Json,
        process_escapes,
    };

    match parser::csv::parse(data, &options) {
        Ok(result) => serialize_result(&result, OutputFormat::Json)
            .map_err(|e| JsValue::from_str(&e.to_json())),
        Err(e) => Err(JsValue::from_str(&e.to_json())),
    }
}

/// Excel 파싱 - WASM 바인딩
///
/// # Arguments
/// * `data` - Excel 파일 바이트 데이터
/// * `separator` - 키 구분자 (".", "/", "-")
/// * `nested` - nested object로 변환 여부
/// * `process_escapes` - escape 시퀀스 처리 여부 (\n, \t 등)
///
/// # Returns
/// JSON string with parsed data or error details
#[wasm_bindgen]
pub fn parse_excel(
    data: &[u8],
    separator: &str,
    nested: bool,
    process_escapes: bool,
) -> Result<String, JsValue> {
    let options = ParseOptions {
        separator: separator.to_string(),
        nested,
        output_format: OutputFormat::Json,
        process_escapes,
    };

    match parser::excel::parse(data, &options) {
        Ok(result) => serialize_result(&result, OutputFormat::Json)
            .map_err(|e| JsValue::from_str(&e.to_json())),
        Err(e) => Err(JsValue::from_str(&e.to_json())),
    }
}

/// CSV 헤더만 파싱하여 언어 목록 반환 - WASM 바인딩
#[wasm_bindgen]
pub fn get_csv_languages(data: &[u8]) -> Result<String, JsValue> {
    match parser::csv::parse_header_only(data) {
        Ok(languages) => serde_json::to_string(&languages).map_err(|e| {
            let err = error::ParseError::json_serialize_error(e);
            JsValue::from_str(&err.to_json())
        }),
        Err(e) => Err(JsValue::from_str(&e.to_json())),
    }
}

/// Excel 헤더만 파싱하여 언어 목록 반환 - WASM 바인딩
#[wasm_bindgen]
pub fn get_excel_languages(data: &[u8]) -> Result<String, JsValue> {
    match parser::excel::parse_header_only(data) {
        Ok(languages) => serde_json::to_string(&languages).map_err(|e| {
            let err = error::ParseError::json_serialize_error(e);
            JsValue::from_str(&err.to_json())
        }),
        Err(e) => Err(JsValue::from_str(&e.to_json())),
    }
}

/// CSV 파싱 - YAML 출력
#[wasm_bindgen]
pub fn parse_csv_yaml(
    data: &[u8],
    separator: &str,
    nested: bool,
    process_escapes: bool,
) -> Result<String, JsValue> {
    let options = ParseOptions {
        separator: separator.to_string(),
        nested,
        output_format: OutputFormat::Yaml,
        process_escapes,
    };

    match parser::csv::parse(data, &options) {
        Ok(result) => serialize_result(&result, OutputFormat::Yaml)
            .map_err(|e| JsValue::from_str(&e.to_json())),
        Err(e) => Err(JsValue::from_str(&e.to_json())),
    }
}

/// Excel 파싱 - YAML 출력
#[wasm_bindgen]
pub fn parse_excel_yaml(
    data: &[u8],
    separator: &str,
    nested: bool,
    process_escapes: bool,
) -> Result<String, JsValue> {
    let options = ParseOptions {
        separator: separator.to_string(),
        nested,
        output_format: OutputFormat::Yaml,
        process_escapes,
    };

    match parser::excel::parse(data, &options) {
        Ok(result) => serialize_result(&result, OutputFormat::Yaml)
            .map_err(|e| JsValue::from_str(&e.to_json())),
        Err(e) => Err(JsValue::from_str(&e.to_json())),
    }
}

/// Excel -> CSV 변환 (첫 번째 시트)
#[wasm_bindgen]
pub fn excel_to_csv(data: &[u8]) -> Result<String, JsValue> {
    parser::excel::to_csv(data).map_err(|e| JsValue::from_str(&e.to_json()))
}

/// Rewrite key separator in CSV text (header is kept as-is).
/// Replaces '.', '/', '-' in the first column (key) with `target_sep`.
#[wasm_bindgen]
pub fn rewrite_csv_key_separator(csv_text: &str, target_sep: &str) -> String {
    transform::rewrite_key_separator_in_csv(csv_text, target_sep)
}

/// Merge multiple JSON locale files into a CSV string.
/// `inputs_json` should be a JSON array of objects:
/// [{ "language": "en", "content": "{...json...}" }, ...]
/// Missing translations are filled with an empty string.
#[wasm_bindgen]
pub fn jsons_to_csv(inputs_json: &str, separator: &str) -> Result<String, JsValue> {
    let inputs: Vec<export::LangJsonInput> = serde_json::from_str(inputs_json).map_err(|e| {
        let err = ParseError::json_parse_error("inputs", e);
        JsValue::from_str(&err.to_json())
    })?;

    export::merge_jsons_to_csv(&inputs, separator).map_err(|e| JsValue::from_str(&e.to_json()))
}

/// Merge multiple JSON locale files into a table (header + rows) serialized as JSON.
/// Helpful for generating Excel on the frontend without pulling in heavy WASM deps.
#[wasm_bindgen]
pub fn jsons_to_table(inputs_json: &str, separator: &str) -> Result<String, JsValue> {
    let inputs: Vec<export::LangJsonInput> = serde_json::from_str(inputs_json).map_err(|e| {
        let err = ParseError::json_parse_error("inputs", e);
        JsValue::from_str(&err.to_json())
    })?;

    match export::merge_jsons_to_table(&inputs, separator) {
        Ok(table) => serde_json::to_string(&table)
            .map_err(|e| JsValue::from_str(&ParseError::json_serialize_error(e).to_json())),
        Err(e) => Err(JsValue::from_str(&e.to_json())),
    }
}

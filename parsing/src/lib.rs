pub mod error;
pub mod lang_codes;
pub mod parser;
pub mod transform;
pub mod types;

#[cfg(test)]
mod bench;

use wasm_bindgen::prelude::*;

use crate::types::{OutputFormat, ParseOptions};

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
        Ok(result) => serde_json::to_string(&result).map_err(|e| {
            let err = error::ParseError::json_serialize_error(&e);
            JsValue::from_str(&err.to_json())
        }),
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
        Ok(result) => serde_json::to_string(&result).map_err(|e| {
            let err = error::ParseError::json_serialize_error(&e);
            JsValue::from_str(&err.to_json())
        }),
        Err(e) => Err(JsValue::from_str(&e.to_json())),
    }
}

/// CSV 헤더만 파싱하여 언어 목록 반환 - WASM 바인딩
#[wasm_bindgen]
pub fn get_csv_languages(data: &[u8]) -> Result<String, JsValue> {
    match parser::csv::parse_header_only(data) {
        Ok(languages) => serde_json::to_string(&languages).map_err(|e| {
            let err = error::ParseError::json_serialize_error(&e);
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
            let err = error::ParseError::json_serialize_error(&e);
            JsValue::from_str(&err.to_json())
        }),
        Err(e) => Err(JsValue::from_str(&e.to_json())),
    }
}

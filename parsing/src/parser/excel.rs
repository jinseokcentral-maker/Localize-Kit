use crate::error::{ParseError, Result};
use crate::parser::validate_header;
use crate::transform::process_escape_sequences;
use crate::types::{LocaleData, ParseOptions, ParseResult};
use calamine::{open_workbook_auto_from_rs, Reader};
use std::collections::HashMap;
use std::io::Cursor;

/// Excel 데이터 파싱
pub fn parse(data: &[u8], options: &ParseOptions) -> Result<ParseResult> {
    let cursor = Cursor::new(data);
    let mut workbook = open_workbook_auto_from_rs(cursor)
        .map_err(|e| ParseError::excel_open_error(&e.to_string()))?;

    let sheet_names = workbook.sheet_names().to_vec();
    if sheet_names.is_empty() {
        return Err(ParseError::empty_workbook());
    }

    let range = workbook
        .worksheet_range(&sheet_names[0])
        .map_err(|e| ParseError::worksheet_read_error(&sheet_names[0], &e.to_string()))?;

    let mut rows = range.rows();

    // 헤더 읽기
    let header_row = rows.next().ok_or_else(ParseError::empty_sheet)?;
    let headers: Vec<String> = header_row
        .iter()
        .map(|cell| cell.to_string().trim().to_string())
        .collect();

    let header_info = validate_header(&headers)?;

    // 1단계: 모든 데이터를 flat하게 수집
    let mut flat_data: HashMap<String, Vec<(String, String)>> = HashMap::new();
    for lang in &header_info.languages {
        flat_data.insert(lang.clone(), Vec::new());
    }

    let mut row_count = 0;
    for row in rows {
        row_count += 1;

        let key = match row.get(0) {
            Some(cell) => cell.to_string().trim().to_string(),
            None => continue,
        };

        if key.is_empty() {
            continue;
        }

        for lang in &header_info.languages {
            let col_idx = header_info.language_indices[lang];
            let raw_value = row
                .get(col_idx)
                .map(|cell| cell.to_string().trim().to_string())
                .unwrap_or_default();

            if raw_value.is_empty() {
                continue;
            }

            let value = if options.process_escapes {
                process_escape_sequences(&raw_value)
            } else {
                raw_value
            };

            flat_data.get_mut(lang).unwrap().push((key.clone(), value));
        }
    }

    // 2단계: nested 또는 flat으로 변환
    let locale_data = if options.nested {
        build_nested_locale_data(flat_data, &options.separator)
    } else {
        build_flat_locale_data(flat_data)
    };

    Ok(ParseResult {
        languages: header_info.languages,
        data: locale_data,
        row_count,
    })
}

/// Flat 데이터를 그대로 LocaleData로 변환
fn build_flat_locale_data(flat_data: HashMap<String, Vec<(String, String)>>) -> LocaleData {
    let mut result: LocaleData = HashMap::new();

    for (lang, entries) in flat_data {
        let mut lang_map: HashMap<String, serde_json::Value> = HashMap::new();
        for (key, value) in entries {
            lang_map.insert(key, serde_json::Value::String(value));
        }
        result.insert(lang, lang_map);
    }

    result
}

/// Flat 데이터를 nested 구조로 변환
fn build_nested_locale_data(
    flat_data: HashMap<String, Vec<(String, String)>>,
    separator: &str,
) -> LocaleData {
    let mut result: LocaleData = HashMap::new();

    for (lang, entries) in flat_data {
        let mut root: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();

        for (key, value) in entries {
            if key.contains(separator) {
                insert_nested(&mut root, &key, value, separator);
            } else {
                root.insert(key, serde_json::Value::String(value));
            }
        }

        let mut lang_map: HashMap<String, serde_json::Value> = HashMap::new();
        for (k, v) in root {
            lang_map.insert(k, v);
        }
        result.insert(lang, lang_map);
    }

    result
}

/// Nested 키를 JSON 구조에 삽입
fn insert_nested(
    root: &mut serde_json::Map<String, serde_json::Value>,
    key: &str,
    value: String,
    separator: &str,
) {
    let parts: Vec<&str> = key.split(separator).collect();
    let mut current = root;

    for (i, part) in parts.iter().enumerate() {
        if i == parts.len() - 1 {
            current.insert(part.to_string(), serde_json::Value::String(value));
            return;
        }

        if !current.contains_key(*part) {
            current.insert(
                part.to_string(),
                serde_json::Value::Object(serde_json::Map::new()),
            );
        }

        current = current
            .get_mut(*part)
            .and_then(|v| v.as_object_mut())
            .expect("Expected object for nested key");
    }
}

/// Excel 헤더만 파싱하여 언어 목록 반환
pub fn parse_header_only(data: &[u8]) -> Result<Vec<String>> {
    let cursor = Cursor::new(data);
    let mut workbook = open_workbook_auto_from_rs(cursor)
        .map_err(|e| ParseError::excel_open_error(&e.to_string()))?;

    let sheet_names = workbook.sheet_names().to_vec();
    if sheet_names.is_empty() {
        return Err(ParseError::empty_workbook());
    }

    let range = workbook
        .worksheet_range(&sheet_names[0])
        .map_err(|e| ParseError::worksheet_read_error(&sheet_names[0], &e.to_string()))?;

    let header_row = range.rows().next().ok_or_else(ParseError::empty_sheet)?;
    let headers: Vec<String> = header_row
        .iter()
        .map(|cell| cell.to_string().trim().to_string())
        .collect();

    let header_info = validate_header(&headers)?;
    Ok(header_info.languages)
}

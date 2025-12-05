use crate::error::{anyhow, Context, Result};
use crate::parser::{build_nested_value, validate_header};
use crate::transform::process_escape_sequences;
use crate::types::{LocaleData, ParseOptions, ParseResult};
use calamine::{open_workbook_auto_from_rs, Reader};
use std::collections::HashMap;
use std::io::Cursor;

/// Excel 데이터 파싱
pub fn parse(data: &[u8], options: &ParseOptions) -> Result<ParseResult> {
    let cursor = Cursor::new(data);
    let mut workbook =
        open_workbook_auto_from_rs(cursor).context("Failed to open Excel workbook")?;

    // 첫 번째 시트 가져오기
    let sheet_names = workbook.sheet_names().to_vec();
    if sheet_names.is_empty() {
        return Err(anyhow!("Empty Excel workbook: no sheets found"));
    }

    let range = workbook
        .worksheet_range(&sheet_names[0])
        .context("Failed to read worksheet")?;

    let mut rows = range.rows();

    // 헤더 읽기
    let header_row = rows.next().ok_or_else(|| anyhow!("Empty Excel sheet"))?;
    let headers: Vec<String> = header_row
        .iter()
        .map(|cell| cell.to_string().trim().to_string())
        .collect();

    // 헤더 검증
    let header_info = validate_header(&headers)?;

    // 언어별 데이터 초기화
    let mut locale_data: LocaleData = HashMap::new();
    for lang in &header_info.languages {
        locale_data.insert(lang.clone(), HashMap::new());
    }

    // 각 행 파싱
    let mut row_count = 0;
    for row in rows {
        row_count += 1;

        // 첫 번째 컬럼: key
        let key = match row.get(0) {
            Some(cell) => cell.to_string().trim().to_string(),
            None => continue,
        };

        if key.is_empty() {
            continue;
        }

        // 각 언어별 값 추출
        for lang in &header_info.languages {
            let col_idx = header_info.language_indices[lang];
            let raw_value = row
                .get(col_idx)
                .map(|cell| cell.to_string().trim().to_string())
                .unwrap_or_default();

            if raw_value.is_empty() {
                continue;
            }

            // escape 시퀀스 처리 (\n, \t 등)
            let value = if options.process_escapes {
                process_escape_sequences(&raw_value)
            } else {
                raw_value
            };

            let lang_map = locale_data.get_mut(lang).unwrap();

            if options.nested && key.contains(&options.separator) {
                // nested object로 변환
                let mut nested_map = serde_json::Map::new();

                // 기존 데이터를 nested_map으로 이동
                for (k, v) in lang_map.iter() {
                    nested_map.insert(k.clone(), v.clone());
                }

                build_nested_value(&mut nested_map, &key, &value, &options.separator);

                // nested_map을 다시 lang_map으로 변환
                lang_map.clear();
                for (k, v) in nested_map {
                    lang_map.insert(k, v);
                }
            } else {
                // flat key로 저장
                lang_map.insert(key.clone(), serde_json::Value::String(value));
            }
        }
    }

    Ok(ParseResult {
        languages: header_info.languages,
        data: locale_data,
        row_count,
    })
}

/// Excel 헤더만 파싱하여 언어 목록 반환
pub fn parse_header_only(data: &[u8]) -> Result<Vec<String>> {
    let cursor = Cursor::new(data);
    let mut workbook =
        open_workbook_auto_from_rs(cursor).context("Failed to open Excel workbook")?;

    let sheet_names = workbook.sheet_names().to_vec();
    if sheet_names.is_empty() {
        return Err(anyhow!("Empty Excel workbook: no sheets found"));
    }

    let range = workbook
        .worksheet_range(&sheet_names[0])
        .context("Failed to read worksheet")?;

    let header_row = range.rows().next().ok_or_else(|| anyhow!("Empty Excel sheet"))?;
    let headers: Vec<String> = header_row
        .iter()
        .map(|cell| cell.to_string().trim().to_string())
        .collect();

    let header_info = validate_header(&headers)?;
    Ok(header_info.languages)
}

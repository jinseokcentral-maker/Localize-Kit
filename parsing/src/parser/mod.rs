pub mod csv;
pub mod excel;

use crate::error::{bail, Result};
use crate::lang_codes::{is_known_lang_code, normalize_lang_code, warn_unknown_lang_code};
use crate::types::HeaderInfo;

/// 헤더 검증: 첫 번째 컬럼이 "key"이고 나머지가 언어 코드인지 확인
pub fn validate_header(headers: &[String]) -> Result<HeaderInfo> {
    if headers.is_empty() {
        bail!("Empty CSV/Excel data");
    }

    let mut info = HeaderInfo::new();

    // 첫 번째 컬럼이 "key"인지 확인 (대소문자 무시)
    let first_col = headers[0].trim().to_lowercase();
    if first_col != "key" {
        bail!("Invalid header: first column must be 'key', got '{}'", headers[0]);
    }
    info.has_valid_key_column = true;

    // 나머지 컬럼들을 언어 코드로 처리
    for (idx, lang) in headers.iter().skip(1).enumerate() {
        let lang_raw = lang.trim();
        if lang_raw.is_empty() {
            continue;
        }

        // 언어 코드 정규화 및 검증
        let lang_normalized = normalize_lang_code(lang_raw);

        if !is_known_lang_code(&lang_normalized) {
            warn_unknown_lang_code(&lang_normalized);
        }

        info.language_indices.insert(lang_normalized.clone(), idx + 1);
        info.languages.push(lang_normalized);
    }

    if info.languages.is_empty() {
        bail!("No language columns found in header");
    }

    Ok(info)
}

/// 키를 separator로 분리하여 nested object로 변환
pub fn build_nested_value(
    target: &mut serde_json::Map<String, serde_json::Value>,
    key: &str,
    value: &str,
    separator: &str,
) {
    let parts: Vec<&str> = key.split(separator).collect();

    if parts.len() == 1 {
        // 단일 키: 직접 삽입
        target.insert(key.to_string(), serde_json::Value::String(value.to_string()));
        return;
    }

    // nested 키: 재귀적으로 object 생성
    let mut current = target;
    for (i, part) in parts.iter().enumerate() {
        if i == parts.len() - 1 {
            // 마지막 파트: 값 삽입
            current.insert(part.to_string(), serde_json::Value::String(value.to_string()));
        } else {
            // 중간 파트: object 생성 또는 기존 object 사용
            current = current
                .entry(part.to_string())
                .or_insert_with(|| serde_json::Value::Object(serde_json::Map::new()))
                .as_object_mut()
                .expect("Expected object for nested key");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_header_valid() {
        let headers = vec![
            "key".to_string(),
            "en".to_string(),
            "ko".to_string(),
            "ja".to_string(),
        ];
        let info = validate_header(&headers).unwrap();

        assert!(info.has_valid_key_column);
        assert_eq!(info.languages, vec!["en", "ko", "ja"]);
        assert_eq!(info.language_indices.get("en"), Some(&1));
        assert_eq!(info.language_indices.get("ko"), Some(&2));
        assert_eq!(info.language_indices.get("ja"), Some(&3));
    }

    #[test]
    fn test_validate_header_invalid_key() {
        let headers = vec!["id".to_string(), "en".to_string()];
        let result = validate_header(&headers);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_header_no_languages() {
        let headers = vec!["key".to_string()];
        let result = validate_header(&headers);
        assert!(result.is_err());
    }

    #[test]
    fn test_build_nested_value() {
        let mut map = serde_json::Map::new();
        build_nested_value(&mut map, "common.button.submit", "Submit", ".");

        let common = map.get("common").unwrap().as_object().unwrap();
        let button = common.get("button").unwrap().as_object().unwrap();
        let submit = button.get("submit").unwrap().as_str().unwrap();

        assert_eq!(submit, "Submit");
    }
}


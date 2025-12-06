use crate::error::Result;
use crate::parser::validate_header;
use crate::transform::process_escape_sequences;
use crate::types::{LocaleData, ParseOptions, ParseResult};
use csv::ReaderBuilder;
use std::collections::{BTreeMap, HashMap, HashSet};
use std::io::Cursor;

/// CSV 데이터 파싱
pub fn parse(data: &[u8], options: &ParseOptions) -> Result<ParseResult> {
    let mut reader = ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)
        .from_reader(Cursor::new(data));

    // 헤더 읽기
    let headers: Vec<String> = reader
        .headers()?
        .iter()
        .map(|s| s.to_string())
        .collect();

    // 헤더 검증
    let header_info = validate_header(&headers)?;

    // 1단계: 모든 데이터를 flat하게 수집
    let mut flat_data: HashMap<String, Vec<(String, String)>> = HashMap::new();
    for lang in &header_info.languages {
        flat_data.insert(lang.clone(), Vec::new());
    }

    // separator 검증용
    let mut separators_found: HashSet<char> = HashSet::new();
    let mut first_offending_row: Option<usize> = None;
    let expected_sep = options.separator.chars().next().unwrap_or('.');

    let mut row_count = 0;
    for result in reader.records() {
        let record = result?;
        row_count += 1;

        let key = match record.get(0) {
            Some(k) => k.trim(),
            None => continue,
        };

        if key.is_empty() {
            continue;
        }

        // key 안의 구분자 추출
        for ch in key.chars() {
            if ch == '.' || ch == '/' || ch == '-' {
                separators_found.insert(ch);
                if ch != expected_sep && first_offending_row.is_none() {
                    first_offending_row = Some(row_count);
                }
            }
        }

        for lang in &header_info.languages {
            let col_idx = header_info.language_indices[lang];
            let raw_value = record.get(col_idx).unwrap_or("").trim();

            if raw_value.is_empty() {
                continue;
            }

            let value = if options.process_escapes {
                process_escape_sequences(raw_value)
            } else {
                raw_value.to_string()
            };

            flat_data.get_mut(lang).unwrap().push((key.to_string(), value));
        }
    }

    // 구분자 혼재 여부 체크
    let invalid: Vec<char> = separators_found
        .iter()
        .cloned()
        .filter(|c| *c != expected_sep)
        .collect();
    if !invalid.is_empty() {
        return Err(crate::error::ParseError::mixed_separators(
            invalid,
            &options.separator,
            first_offending_row,
        ));
    }

    // 2단계: nested 또는 flat으로 변환
    let mut locale_data = if options.nested {
        build_nested_locale_data(flat_data, &options.separator)
    } else {
        build_flat_locale_data(flat_data)
    };

    // 알파벳 순 정렬
    locale_data = crate::transform::sort_locale_data(locale_data);

    Ok(ParseResult {
        languages: header_info.languages,
        data: locale_data,
        row_count,
    })
}

/// Flat 데이터를 그대로 LocaleData로 변환
fn build_flat_locale_data(flat_data: HashMap<String, Vec<(String, String)>>) -> LocaleData {
    let mut result: LocaleData = BTreeMap::new();

    for (lang, entries) in flat_data {
        let mut lang_map: BTreeMap<String, serde_json::Value> = BTreeMap::new();
        for (key, value) in entries {
            lang_map.insert(key, serde_json::Value::String(value));
        }
        result.insert(lang, lang_map);
    }

    result
}

/// Flat 데이터를 nested 구조로 변환 (한 번에 처리)
fn build_nested_locale_data(
    flat_data: HashMap<String, Vec<(String, String)>>,
    separator: &str,
) -> LocaleData {
    let mut result: LocaleData = BTreeMap::new();

    for (lang, entries) in flat_data {
        let mut root: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();

        for (key, value) in entries {
            if key.contains(separator) {
                insert_nested(&mut root, &key, value, separator);
            } else {
                root.insert(key, serde_json::Value::String(value));
            }
        }

        // serde_json::Map을 HashMap으로 변환
        let mut lang_map: BTreeMap<String, serde_json::Value> = BTreeMap::new();
        for (k, v) in root {
            lang_map.insert(k, crate::transform::sort_value(v));
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
            // 마지막 파트: 값 삽입
            current.insert(part.to_string(), serde_json::Value::String(value));
            return;
        }

        // 중간 파트: object 생성 또는 기존 object 사용
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

/// CSV 헤더만 파싱하여 언어 목록 반환
pub fn parse_header_only(data: &[u8]) -> Result<Vec<String>> {
    let mut reader = ReaderBuilder::new()
        .has_headers(true)
        .from_reader(Cursor::new(data));

    let headers: Vec<String> = reader
        .headers()?
        .iter()
        .map(|s| s.to_string())
        .collect();

    let header_info = validate_header(&headers)?;
    Ok(header_info.languages)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_csv() {
        let csv_str = "key,en,ko\ngreeting,Hello,안녕하세요\nfarewell,Goodbye,안녕히 가세요";
        let csv_data = csv_str.as_bytes();

        let options = ParseOptions::default();
        let result = parse(csv_data, &options).unwrap();

        assert_eq!(result.languages, vec!["en", "ko"]);
        assert_eq!(result.row_count, 2);

        let en = result.data.get("en").unwrap();
        assert_eq!(en.get("greeting").unwrap(), "Hello");
        assert_eq!(en.get("farewell").unwrap(), "Goodbye");

        let ko = result.data.get("ko").unwrap();
        assert_eq!(ko.get("greeting").unwrap(), "안녕하세요");
        assert_eq!(ko.get("farewell").unwrap(), "안녕히 가세요");
    }

    #[test]
    fn test_parse_nested_keys() {
        let csv_str = "key,en,ko\ncommon.button.submit,Submit,제출\ncommon.button.cancel,Cancel,취소";
        let csv_data = csv_str.as_bytes();

        let options = ParseOptions {
            separator: ".".to_string(),
            nested: true,
            ..Default::default()
        };
        let result = parse(csv_data, &options).unwrap();

        let en = result.data.get("en").unwrap();
        let common = en.get("common").unwrap().as_object().unwrap();
        let button = common.get("button").unwrap().as_object().unwrap();

        assert_eq!(button.get("submit").unwrap(), "Submit");
        assert_eq!(button.get("cancel").unwrap(), "Cancel");
    }

    #[test]
    fn test_parse_header_only() {
        let csv_data = b"key,en,ko,ja,zh
row1,a,b,c,d";

        let languages = parse_header_only(csv_data).unwrap();
        assert_eq!(languages, vec!["en", "ko", "ja", "zh"]);
    }

    #[test]
    fn test_parse_real_world_csv() {
        let csv_str = r#"key,en,ko,ja
common.hello,Hello,안녕하세요,こんにちは
common.goodbye,Goodbye,안녕히 가세요,さようなら
common.welcome,Welcome,환영합니다,ようこそ
auth.login,Login,로그인,ログイン
auth.logout,Logout,로그아웃,ログアウト
auth.signup,Sign up,회원가입,新規登録
errors.notFound,Page not found,페이지를 찾을 수 없습니다,ページが見つかりません
errors.serverError,Server error,서버 오류,サーバーエラー"#;

        let options = ParseOptions {
            separator: ".".to_string(),
            nested: true,
            ..Default::default()
        };
        let result = parse(csv_str.as_bytes(), &options).unwrap();

        assert_eq!(result.languages, vec!["en", "ko", "ja"]);
        assert_eq!(result.row_count, 8);

        let en = result.data.get("en").unwrap();
        let common = en.get("common").unwrap().as_object().unwrap();
        assert_eq!(common.get("hello").unwrap(), "Hello");
        assert_eq!(common.get("goodbye").unwrap(), "Goodbye");
        assert_eq!(common.get("welcome").unwrap(), "Welcome");

        let auth = en.get("auth").unwrap().as_object().unwrap();
        assert_eq!(auth.get("login").unwrap(), "Login");
        assert_eq!(auth.get("logout").unwrap(), "Logout");
        assert_eq!(auth.get("signup").unwrap(), "Sign up");

        let errors = en.get("errors").unwrap().as_object().unwrap();
        assert_eq!(errors.get("notFound").unwrap(), "Page not found");
        assert_eq!(errors.get("serverError").unwrap(), "Server error");

        let ko = result.data.get("ko").unwrap();
        let common_ko = ko.get("common").unwrap().as_object().unwrap();
        assert_eq!(common_ko.get("hello").unwrap(), "안녕하세요");

        let ja = result.data.get("ja").unwrap();
        let auth_ja = ja.get("auth").unwrap().as_object().unwrap();
        assert_eq!(auth_ja.get("login").unwrap(), "ログイン");
    }

    #[test]
    fn test_parse_flat_keys() {
        let csv_str = r#"key,en,ko,ja
common.hello,Hello,안녕하세요,こんにちは
common.goodbye,Goodbye,안녕히 가세요,さようなら
auth.login,Login,로그인,ログイン"#;

        let options = ParseOptions {
            separator: ".".to_string(),
            nested: false,
            ..Default::default()
        };
        let result = parse(csv_str.as_bytes(), &options).unwrap();

        let en = result.data.get("en").unwrap();
        assert_eq!(en.get("common.hello").unwrap(), "Hello");
        assert_eq!(en.get("common.goodbye").unwrap(), "Goodbye");
        assert_eq!(en.get("auth.login").unwrap(), "Login");

        let ko = result.data.get("ko").unwrap();
        assert_eq!(ko.get("common.hello").unwrap(), "안녕하세요");
    }

    #[test]
    fn test_parse_with_escape_sequences() {
        let csv_str = r#"key,en,ko
message.multiline,Hello\nWorld,안녕\n세상
message.tab,Name:\tJohn,이름:\t홍길동
message.quote,Say \"Hi\",\"안녕\"이라고 말해"#;

        let options = ParseOptions::default();
        let result = parse(csv_str.as_bytes(), &options).unwrap();

        let en = result.data.get("en").unwrap();
        let message = en.get("message").unwrap().as_object().unwrap();

        assert_eq!(message.get("multiline").unwrap(), "Hello\nWorld");
        assert_eq!(message.get("tab").unwrap(), "Name:\tJohn");
        assert_eq!(message.get("quote").unwrap(), "Say \"Hi\"");

        let ko = result.data.get("ko").unwrap();
        let message_ko = ko.get("message").unwrap().as_object().unwrap();
        assert_eq!(message_ko.get("multiline").unwrap(), "안녕\n세상");
    }

    #[test]
    fn test_parse_without_escape_processing() {
        let csv_str = r#"key,en,ko
message,Hello\nWorld,안녕\n세상"#;

        let options = ParseOptions {
            process_escapes: false,
            ..Default::default()
        };
        let result = parse(csv_str.as_bytes(), &options).unwrap();

        let en = result.data.get("en").unwrap();
        assert_eq!(en.get("message").unwrap(), "Hello\\nWorld");
    }

    #[test]
    fn test_parse_with_variables() {
        let csv_str = r#"key,en,ko
greeting,Hello {{name}}!,안녕 {{name}}님!
count,You have {{count}} items,{{count}}개 항목이 있습니다"#;

        let options = ParseOptions::default();
        let result = parse(csv_str.as_bytes(), &options).unwrap();

        let en = result.data.get("en").unwrap();
        assert_eq!(en.get("greeting").unwrap(), "Hello {{name}}!");
        assert_eq!(en.get("count").unwrap(), "You have {{count}} items");

        let ko = result.data.get("ko").unwrap();
        assert_eq!(ko.get("greeting").unwrap(), "안녕 {{name}}님!");
    }

    #[test]
    fn test_parse_with_html_tags() {
        let csv_str = r#"key,en,ko
styled,Click <b>here</b>,<b>여기</b>를 클릭
link,Visit <a href="url">link</a>,<a href="url">링크</a> 방문"#;

        let options = ParseOptions::default();
        let result = parse(csv_str.as_bytes(), &options).unwrap();

        let en = result.data.get("en").unwrap();
        assert_eq!(en.get("styled").unwrap(), "Click <b>here</b>");
        assert!(en.get("link").unwrap().as_str().unwrap().contains("<a href="));
    }

    #[test]
    fn test_mixed_separators_error() {
        let csv_str = r#"key,en,ko
common.hello,Hello,안녕하세요
auth/login,Login,로그인"#;

        let options = ParseOptions {
            separator: ".".to_string(),
            ..Default::default()
        };
        let err = parse(csv_str.as_bytes(), &options).unwrap_err();
        assert_eq!(err.kind, crate::error::ErrorKind::MixedSeparators);
    }
}

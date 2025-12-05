use crate::error::Result;
use crate::parser::{build_nested_value, validate_header};
use crate::transform::process_escape_sequences;
use crate::types::{LocaleData, ParseOptions, ParseResult};
use csv::ReaderBuilder;
use std::collections::HashMap;
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

    // 언어별 데이터 초기화
    let mut locale_data: LocaleData = HashMap::new();
    for lang in &header_info.languages {
        locale_data.insert(lang.clone(), HashMap::new());
    }

    // 각 행 파싱
    let mut row_count = 0;
    for result in reader.records() {
        let record = result?;
        row_count += 1;

        // 첫 번째 컬럼: key
        let key = match record.get(0) {
            Some(k) => k.trim(),
            None => continue,
        };

        if key.is_empty() {
            continue;
        }

        // 각 언어별 값 추출
        for lang in &header_info.languages {
            let col_idx = header_info.language_indices[lang];
            let raw_value = record.get(col_idx).unwrap_or("").trim();

            if raw_value.is_empty() {
                continue;
            }

            // escape 시퀀스 처리 (\n, \t 등)
            let value = if options.process_escapes {
                process_escape_sequences(raw_value)
            } else {
                raw_value.to_string()
            };

            let lang_map = locale_data.get_mut(lang).unwrap();

            if options.nested && key.contains(&options.separator) {
                // nested object로 변환
                let mut nested_map = serde_json::Map::new();

                // 기존 데이터를 nested_map으로 이동
                for (k, v) in lang_map.iter() {
                    nested_map.insert(k.clone(), v.clone());
                }

                build_nested_value(&mut nested_map, key, &value, &options.separator);

                // nested_map을 다시 lang_map으로 변환
                lang_map.clear();
                for (k, v) in nested_map {
                    lang_map.insert(k, v);
                }
            } else {
                // flat key로 저장
                lang_map.insert(key.to_string(), serde_json::Value::String(value));
            }
        }
    }

    Ok(ParseResult {
        languages: header_info.languages,
        data: locale_data,
        row_count,
    })
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

        // 언어 확인
        assert_eq!(result.languages, vec!["en", "ko", "ja"]);
        assert_eq!(result.row_count, 8);

        // nested 구조 확인 (en)
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

        // nested 구조 확인 (ko)
        let ko = result.data.get("ko").unwrap();
        let common_ko = ko.get("common").unwrap().as_object().unwrap();
        assert_eq!(common_ko.get("hello").unwrap(), "안녕하세요");

        // nested 구조 확인 (ja)
        let ja = result.data.get("ja").unwrap();
        let auth_ja = ja.get("auth").unwrap().as_object().unwrap();
        assert_eq!(auth_ja.get("login").unwrap(), "ログイン");

        // JSON 출력 확인
        let json_output = serde_json::to_string_pretty(&result).unwrap();
        println!("=== JSON Output ===\n{}", json_output);
    }

    #[test]
    fn test_parse_flat_keys() {
        let csv_str = r#"key,en,ko,ja
common.hello,Hello,안녕하세요,こんにちは
common.goodbye,Goodbye,안녕히 가세요,さようなら
auth.login,Login,로그인,ログイン"#;

        let options = ParseOptions {
            separator: ".".to_string(),
            nested: false,  // nested 끔!
            ..Default::default()
        };
        let result = parse(csv_str.as_bytes(), &options).unwrap();

        // flat 키로 저장되어야 함
        let en = result.data.get("en").unwrap();
        assert_eq!(en.get("common.hello").unwrap(), "Hello");
        assert_eq!(en.get("common.goodbye").unwrap(), "Goodbye");
        assert_eq!(en.get("auth.login").unwrap(), "Login");

        let ko = result.data.get("ko").unwrap();
        assert_eq!(ko.get("common.hello").unwrap(), "안녕하세요");

        // JSON 출력 확인
        let json_output = serde_json::to_string_pretty(&result).unwrap();
        println!("=== Flat Keys Output ===\n{}", json_output);
    }

    #[test]
    fn test_parse_with_escape_sequences() {
        let csv_str = r#"key,en,ko
message.multiline,Hello\nWorld,안녕\n세상
message.tab,Name:\tJohn,이름:\t홍길동
message.quote,Say \"Hi\",\"안녕\"이라고 말해"#;

        // process_escapes: true (기본값)
        let options = ParseOptions::default();
        let result = parse(csv_str.as_bytes(), &options).unwrap();

        let en = result.data.get("en").unwrap();
        let message = en.get("message").unwrap().as_object().unwrap();

        // \n이 실제 줄바꿈으로 변환됨
        assert_eq!(message.get("multiline").unwrap(), "Hello\nWorld");
        // \t가 실제 탭으로 변환됨
        assert_eq!(message.get("tab").unwrap(), "Name:\tJohn");
        // \"가 실제 따옴표로 변환됨
        assert_eq!(message.get("quote").unwrap(), "Say \"Hi\"");

        let ko = result.data.get("ko").unwrap();
        let message_ko = ko.get("message").unwrap().as_object().unwrap();
        assert_eq!(message_ko.get("multiline").unwrap(), "안녕\n세상");

        println!("=== Escape Sequences Output ===");
        println!("{}", serde_json::to_string_pretty(&result).unwrap());
    }

    #[test]
    fn test_parse_without_escape_processing() {
        let csv_str = r#"key,en,ko
message,Hello\nWorld,안녕\n세상"#;

        // process_escapes: false
        let options = ParseOptions {
            process_escapes: false,
            ..Default::default()
        };
        let result = parse(csv_str.as_bytes(), &options).unwrap();

        let en = result.data.get("en").unwrap();
        // \n이 그대로 유지됨 (두 글자)
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
        // 변수는 그대로 유지
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
        // HTML 태그 유지
        assert_eq!(en.get("styled").unwrap(), "Click <b>here</b>");
        assert!(en.get("link").unwrap().as_str().unwrap().contains("<a href="));
    }
}


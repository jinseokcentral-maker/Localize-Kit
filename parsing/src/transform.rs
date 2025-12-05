//! 문자열 변환 및 검증 규칙
//!
//! i18n 문자열에서 사용되는 다양한 패턴들을 처리합니다:
//! - Escape 시퀀스 (\n, \t, \\, \", \')
//! - 변수/플레이스홀더 ({{name}}, {name}, %s)
//! - HTML 태그
//! - 복수형 키
//! - Nesting 참조

use regex_lite::Regex;
use std::sync::LazyLock;

// ============================================================================
// Regex 패턴들 (LazyLock으로 한 번만 컴파일)
// ============================================================================

/// react-i18next 스타일 변수: {{name}}, {{count}}
static RE_DOUBLE_BRACE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\{\{([^}]+)\}\}").unwrap());

/// Vue i18n / ICU 스타일 변수: {name}, {count}
static RE_SINGLE_BRACE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\{([^}]+)\}").unwrap());

/// printf 스타일 변수: %s, %d, %f, %1$s
static RE_PRINTF: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"%(\d+\$)?[sdifFeEgGxXoubcpn%]").unwrap());

/// HTML 태그: <b>, </b>, <a href="...">, <br/>, <1>, </1>
static RE_HTML_TAG: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"</?[a-zA-Z0-9]+(?:\s+[^>]*)?>").unwrap());

/// react-i18next nesting: $t(key), $t(key, { "param": "value" })
static RE_NESTING: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\$t\([^)]+\)").unwrap());

/// Escape 시퀀스: \n, \t, \r, \\, \", \'
static RE_ESCAPE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#"\\[ntr\\'""]"#).unwrap());

// ============================================================================
// Escape 시퀀스 처리
// ============================================================================

/// Escape 시퀀스를 실제 문자로 변환
///
/// CSV에서 읽은 `\n`(두 글자)을 실제 줄바꿈 문자(한 글자)로 변환
///
/// # 예시
/// ```
/// use parsing::transform::process_escape_sequences;
///
/// let input = r"Hello\nWorld";
/// let output = process_escape_sequences(input);
/// assert_eq!(output, "Hello\nWorld");
/// ```
pub fn process_escape_sequences(input: &str) -> String {
    let mut result = String::with_capacity(input.len());
    let mut chars = input.chars().peekable();

    while let Some(c) = chars.next() {
        if c == '\\' {
            match chars.peek() {
                Some('n') => {
                    result.push('\n');
                    chars.next();
                }
                Some('t') => {
                    result.push('\t');
                    chars.next();
                }
                Some('r') => {
                    result.push('\r');
                    chars.next();
                }
                Some('\\') => {
                    result.push('\\');
                    chars.next();
                }
                Some('"') => {
                    result.push('"');
                    chars.next();
                }
                Some('\'') => {
                    result.push('\'');
                    chars.next();
                }
                _ => {
                    // 알 수 없는 escape는 그대로 유지
                    result.push(c);
                }
            }
        } else {
            result.push(c);
        }
    }

    result
}

/// 문자열에 escape 시퀀스가 포함되어 있는지 확인
pub fn has_escape_sequences(input: &str) -> bool {
    RE_ESCAPE.is_match(input)
}

/// escape 시퀀스 목록 추출
pub fn extract_escape_sequences(input: &str) -> Vec<String> {
    RE_ESCAPE
        .find_iter(input)
        .map(|m| m.as_str().to_string())
        .collect()
}

// ============================================================================
// 변수/플레이스홀더 처리
// ============================================================================

/// 변수 타입
#[derive(Debug, Clone, PartialEq)]
pub enum VariableType {
    /// {{name}} - react-i18next
    DoubleBrace,
    /// {name} - Vue i18n, ICU
    SingleBrace,
    /// %s, %d - printf
    Printf,
}

/// 발견된 변수 정보
#[derive(Debug, Clone)]
pub struct Variable {
    pub var_type: VariableType,
    pub full_match: String,
    pub name: Option<String>, // printf의 경우 None
}

/// 문자열에서 모든 변수 추출
pub fn extract_variables(input: &str) -> Vec<Variable> {
    let mut variables = Vec::new();

    // {{name}} 패턴
    for cap in RE_DOUBLE_BRACE.captures_iter(input) {
        variables.push(Variable {
            var_type: VariableType::DoubleBrace,
            full_match: cap[0].to_string(),
            name: Some(cap[1].to_string()),
        });
    }

    // {name} 패턴 ({{}}가 아닌 것만)
    for cap in RE_SINGLE_BRACE.captures_iter(input) {
        let full = &cap[0];
        // {{name}}의 일부가 아닌지 확인
        if !input.contains(&format!("{{{}", full)) && !input.contains(&format!("{}}}", full)) {
            variables.push(Variable {
                var_type: VariableType::SingleBrace,
                full_match: full.to_string(),
                name: Some(cap[1].to_string()),
            });
        }
    }

    // %s, %d 패턴
    for mat in RE_PRINTF.find_iter(input) {
        variables.push(Variable {
            var_type: VariableType::Printf,
            full_match: mat.as_str().to_string(),
            name: None,
        });
    }

    variables
}

/// 문자열에 변수가 포함되어 있는지 확인
pub fn has_variables(input: &str) -> bool {
    RE_DOUBLE_BRACE.is_match(input)
        || RE_SINGLE_BRACE.is_match(input)
        || RE_PRINTF.is_match(input)
}

/// 변수 이름만 추출 (디버깅/검증용)
pub fn extract_variable_names(input: &str) -> Vec<String> {
    extract_variables(input)
        .into_iter()
        .filter_map(|v| v.name)
        .collect()
}

// ============================================================================
// HTML 태그 처리
// ============================================================================

/// 문자열에서 HTML 태그 추출
pub fn extract_html_tags(input: &str) -> Vec<String> {
    RE_HTML_TAG
        .find_iter(input)
        .map(|m| m.as_str().to_string())
        .collect()
}

/// 문자열에 HTML 태그가 포함되어 있는지 확인
pub fn has_html_tags(input: &str) -> bool {
    RE_HTML_TAG.is_match(input)
}

// ============================================================================
// Nesting 참조 처리 ($t(key))
// ============================================================================

/// $t(key) 패턴 추출
pub fn extract_nesting_references(input: &str) -> Vec<String> {
    RE_NESTING
        .find_iter(input)
        .map(|m| m.as_str().to_string())
        .collect()
}

/// 문자열에 nesting 참조가 있는지 확인
pub fn has_nesting_references(input: &str) -> bool {
    RE_NESTING.is_match(input)
}

// ============================================================================
// 복수형 키 처리
// ============================================================================

/// 복수형 접미사 목록
const PLURAL_SUFFIXES: &[&str] = &[
    "_zero",
    "_one",
    "_two",
    "_few",
    "_many",
    "_other",
    "_plural",
    // 숫자 기반
    "_0",
    "_1",
    "_2",
];

/// 키가 복수형 키인지 확인
pub fn is_plural_key(key: &str) -> bool {
    PLURAL_SUFFIXES.iter().any(|suffix| key.ends_with(suffix))
}

/// 복수형 키에서 기본 키 추출
/// 예: "items_one" -> "items", "items_other" -> "items"
pub fn get_plural_base_key(key: &str) -> Option<String> {
    for suffix in PLURAL_SUFFIXES {
        if key.ends_with(suffix) {
            return Some(key[..key.len() - suffix.len()].to_string());
        }
    }
    None
}

/// 복수형 키에서 접미사 추출
/// 예: "items_one" -> "one", "items_other" -> "other"
pub fn get_plural_suffix(key: &str) -> Option<String> {
    for suffix in PLURAL_SUFFIXES {
        if key.ends_with(suffix) {
            // "_" 제거하고 반환
            return Some(suffix[1..].to_string());
        }
    }
    None
}

// ============================================================================
// Context 키 처리
// ============================================================================

/// Context 접미사 목록
const CONTEXT_SUFFIXES: &[&str] = &["_male", "_female", "_neutral"];

/// 키가 context 키인지 확인
pub fn is_context_key(key: &str) -> bool {
    CONTEXT_SUFFIXES.iter().any(|suffix| key.ends_with(suffix))
}

/// context 키에서 기본 키 추출
pub fn get_context_base_key(key: &str) -> Option<String> {
    for suffix in CONTEXT_SUFFIXES {
        if key.ends_with(suffix) {
            return Some(key[..key.len() - suffix.len()].to_string());
        }
    }
    None
}

// ============================================================================
// 문자열 분석 결과
// ============================================================================

/// 문자열 분석 결과
#[derive(Debug, Clone, Default)]
pub struct StringAnalysis {
    pub has_escape_sequences: bool,
    pub escape_sequences: Vec<String>,
    pub has_variables: bool,
    pub variables: Vec<Variable>,
    pub has_html_tags: bool,
    pub html_tags: Vec<String>,
    pub has_nesting: bool,
    pub nesting_refs: Vec<String>,
    pub is_plural_key: bool,
    pub plural_base_key: Option<String>,
    pub is_context_key: bool,
    pub context_base_key: Option<String>,
}

/// 문자열 종합 분석
pub fn analyze_string(key: &str, value: &str) -> StringAnalysis {
    StringAnalysis {
        has_escape_sequences: has_escape_sequences(value),
        escape_sequences: extract_escape_sequences(value),
        has_variables: has_variables(value),
        variables: extract_variables(value),
        has_html_tags: has_html_tags(value),
        html_tags: extract_html_tags(value),
        has_nesting: has_nesting_references(value),
        nesting_refs: extract_nesting_references(value),
        is_plural_key: is_plural_key(key),
        plural_base_key: get_plural_base_key(key),
        is_context_key: is_context_key(key),
        context_base_key: get_context_base_key(key),
    }
}

// ============================================================================
// 테스트
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // Escape 시퀀스 테스트
    #[test]
    fn test_process_escape_sequences() {
        assert_eq!(process_escape_sequences(r"Hello\nWorld"), "Hello\nWorld");
        assert_eq!(process_escape_sequences(r"Tab\there"), "Tab\there");
        assert_eq!(process_escape_sequences("Quote\\\"test"), "Quote\"test");
        assert_eq!(process_escape_sequences(r"Back\\slash"), "Back\\slash");
        assert_eq!(
            process_escape_sequences(r"Line1\nLine2\nLine3"),
            "Line1\nLine2\nLine3"
        );
    }

    #[test]
    fn test_has_escape_sequences() {
        assert!(has_escape_sequences(r"Hello\nWorld"));
        assert!(has_escape_sequences(r"Tab\there"));
        assert!(!has_escape_sequences("No escape here"));
    }

    // 변수 테스트
    #[test]
    fn test_extract_double_brace_variables() {
        let vars = extract_variables("Hello, {{name}}! You have {{count}} messages.");
        assert_eq!(vars.len(), 2);
        assert_eq!(vars[0].name, Some("name".to_string()));
        assert_eq!(vars[1].name, Some("count".to_string()));
    }

    #[test]
    fn test_extract_printf_variables() {
        let vars = extract_variables("Hello, %s! You have %d messages.");
        let printf_vars: Vec<_> = vars
            .iter()
            .filter(|v| v.var_type == VariableType::Printf)
            .collect();
        assert_eq!(printf_vars.len(), 2);
        assert_eq!(printf_vars[0].full_match, "%s");
        assert_eq!(printf_vars[1].full_match, "%d");
    }

    #[test]
    fn test_has_variables() {
        assert!(has_variables("Hello, {{name}}!"));
        assert!(has_variables("Hello, %s!"));
        assert!(!has_variables("No variables here"));
    }

    // HTML 태그 테스트
    #[test]
    fn test_extract_html_tags() {
        let tags = extract_html_tags("Click <b>here</b> or <a href='url'>link</a>");
        assert_eq!(tags.len(), 4);
        assert!(tags.contains(&"<b>".to_string()));
        assert!(tags.contains(&"</b>".to_string()));
    }

    #[test]
    fn test_has_html_tags() {
        assert!(has_html_tags("<b>bold</b>"));
        assert!(has_html_tags("<1>tagged</1>"));
        assert!(!has_html_tags("No tags here"));
    }

    // Nesting 테스트
    #[test]
    fn test_extract_nesting() {
        let refs = extract_nesting_references("$t(greeting), {{name}}!");
        assert_eq!(refs.len(), 1);
        assert_eq!(refs[0], "$t(greeting)");
    }

    // 복수형 키 테스트
    #[test]
    fn test_plural_key() {
        assert!(is_plural_key("items_one"));
        assert!(is_plural_key("items_other"));
        assert!(is_plural_key("count_zero"));
        assert!(!is_plural_key("items"));

        assert_eq!(get_plural_base_key("items_one"), Some("items".to_string()));
        assert_eq!(get_plural_suffix("items_one"), Some("one".to_string()));
    }

    // Context 키 테스트
    #[test]
    fn test_context_key() {
        assert!(is_context_key("friend_male"));
        assert!(is_context_key("friend_female"));
        assert!(!is_context_key("friend"));

        assert_eq!(
            get_context_base_key("friend_male"),
            Some("friend".to_string())
        );
    }

    // 종합 분석 테스트
    #[test]
    fn test_analyze_string() {
        let analysis = analyze_string(
            "items_one",
            r"You have {{count}} item.\nClick <b>here</b>.",
        );

        assert!(analysis.has_variables);
        assert!(analysis.has_escape_sequences);
        assert!(analysis.has_html_tags);
        assert!(analysis.is_plural_key);
        assert_eq!(analysis.plural_base_key, Some("items".to_string()));
    }
}


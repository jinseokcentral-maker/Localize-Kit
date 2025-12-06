use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashMap};

/// CSV/Excel 헤더 정보
#[derive(Debug, Clone)]
pub struct HeaderInfo {
    /// 첫 번째 컬럼이 "key"인지 확인됨
    pub has_valid_key_column: bool,
    /// 언어 코드 목록 (예: ["en", "ko", "ja"])
    pub languages: Vec<String>,
    /// 언어 코드 -> 컬럼 인덱스 매핑
    pub language_indices: HashMap<String, usize>,
}

impl HeaderInfo {
    pub fn new() -> Self {
        Self {
            has_valid_key_column: false,
            languages: Vec::new(),
            language_indices: HashMap::new(),
        }
    }
}

impl Default for HeaderInfo {
    fn default() -> Self {
        Self::new()
    }
}

/// 파싱 옵션
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParseOptions {
    /// 키 구분자 (".", "/", "-")
    pub separator: String,
    /// nested object로 변환 여부
    pub nested: bool,
    /// 출력 포맷 ("json", "yaml", "i18n")
    pub output_format: OutputFormat,
    /// escape 시퀀스 처리 여부 (\n, \t 등을 실제 문자로 변환)
    pub process_escapes: bool,
}

impl Default for ParseOptions {
    fn default() -> Self {
        Self {
            separator: ".".to_string(),
            nested: true,
            output_format: OutputFormat::Json,
            process_escapes: true,
        }
    }
}

/// 출력 포맷
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum OutputFormat {
    Json,
    Yaml,
    I18n,
}

/// 파싱 결과: 언어별 키-값 맵
/// 예: { "en": { "greeting": "Hello" }, "ko": { "greeting": "안녕" } }
/// BTreeMap을 사용해 키 알파벳 순서를 보장
pub type LocaleData = BTreeMap<String, BTreeMap<String, serde_json::Value>>;

/// 파싱 결과
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParseResult {
    /// 헤더에서 발견된 언어 목록
    pub languages: Vec<String>,
    /// 언어별 번역 데이터
    pub data: LocaleData,
    /// 파싱된 행 수
    pub row_count: usize,
}


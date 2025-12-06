use std::collections::HashSet;
use std::sync::LazyLock;

/// ISO 언어 코드 목록 (http://www.lingoes.net/en/translator/langcode.htm 기반)
static KNOWN_LANG_CODES: LazyLock<HashSet<&'static str>> = LazyLock::new(|| {
    HashSet::from([
        // 기본 언어 코드 (ISO 639-1)
        "af", "ar", "az", "be", "bg", "bs", "ca", "cs", "cy", "da", "de", "dv", "el", "en", "eo",
        "es", "et", "eu", "fa", "fi", "fo", "fr", "gl", "gu", "he", "hi", "hr", "hu", "hy", "id",
        "is", "it", "ja", "ka", "kk", "kn", "ko", "kok", "ky", "lt", "lv", "mi", "mk", "mn", "mr",
        "ms", "mt", "nb", "nl", "nn", "ns", "pa", "pl", "ps", "pt", "qu", "ro", "ru", "sa", "se",
        "sk", "sl", "sq", "sr", "sv", "sw", "syr", "ta", "te", "th", "tl", "tn", "tr", "tt", "ts",
        "uk", "ur", "uz", "vi", "xh", "zh", "zu",
        // 지역 코드 포함 (ISO 639-1 + ISO 3166-1 alpha-2)
        "af-ZA", "ar-AE", "ar-BH", "ar-DZ", "ar-EG", "ar-IQ", "ar-JO", "ar-KW", "ar-LB", "ar-LY",
        "ar-MA", "ar-OM", "ar-QA", "ar-SA", "ar-SY", "ar-TN", "ar-YE", "az-AZ", "be-BY", "bg-BG",
        "bs-BA", "ca-ES", "cs-CZ", "cy-GB", "da-DK", "de-AT", "de-CH", "de-DE", "de-LI", "de-LU",
        "dv-MV", "el-GR", "en-AU", "en-BZ", "en-CA", "en-CB", "en-GB", "en-IE", "en-JM", "en-NZ",
        "en-PH", "en-TT", "en-US", "en-ZA", "en-ZW", "es-AR", "es-BO", "es-CL", "es-CO", "es-CR",
        "es-DO", "es-EC", "es-ES", "es-GT", "es-HN", "es-MX", "es-NI", "es-PA", "es-PE", "es-PR",
        "es-PY", "es-SV", "es-UY", "es-VE", "et-EE", "eu-ES", "fa-IR", "fi-FI", "fo-FO", "fr-BE",
        "fr-CA", "fr-CH", "fr-FR", "fr-LU", "fr-MC", "gl-ES", "gu-IN", "he-IL", "hi-IN", "hr-BA",
        "hr-HR", "hu-HU", "hy-AM", "id-ID", "is-IS", "it-CH", "it-IT", "ja-JP", "ka-GE", "kk-KZ",
        "kn-IN", "ko-KR", "kok-IN", "ky-KG", "lt-LT", "lv-LV", "mi-NZ", "mk-MK", "mn-MN", "mr-IN",
        "ms-BN", "ms-MY", "mt-MT", "nb-NO", "nl-BE", "nl-NL", "nn-NO", "ns-ZA", "pa-IN", "pl-PL",
        "ps-AR", "pt-BR", "pt-PT", "qu-BO", "qu-EC", "qu-PE", "ro-RO", "ru-RU", "sa-IN", "se-FI",
        "se-NO", "se-SE", "sk-SK", "sl-SI", "sq-AL", "sr-BA", "sr-SP", "sv-FI", "sv-SE", "sw-KE",
        "syr-SY", "ta-IN", "te-IN", "th-TH", "tl-PH", "tn-ZA", "tr-TR", "tt-RU", "uk-UA", "ur-PK",
        "uz-UZ", "vi-VN", "xh-ZA", "zh-CN", "zh-HK", "zh-MO", "zh-SG", "zh-TW", "zu-ZA",
    ])
});

/// 언어 코드가 알려진 ISO 코드인지 확인
pub fn is_known_lang_code(code: &str) -> bool {
    // 대소문자 무시하여 비교
    let normalized = normalize_lang_code(code);
    KNOWN_LANG_CODES.contains(normalized.as_str())
}

/// 언어 코드 정규화 (소문자로 변환, 지역 코드는 대문자 유지)
/// 예: "EN-us" -> "en-US", "KO" -> "ko", "zh_cn" -> "zh-CN"
pub fn normalize_lang_code(code: &str) -> String {
    let code = code.replace('_', "-"); // underscore도 동일하게 취급
    if let Some((lang, region)) = code.split_once('-') {
        format!("{}-{}", lang.to_lowercase(), region.to_uppercase())
    } else {
        code.to_lowercase()
    }
}

/// 알 수 없는 언어 코드에 대해 경고 출력
#[cfg(target_arch = "wasm32")]
pub fn warn_unknown_lang_code(code: &str) {
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen]
    extern "C" {
        #[wasm_bindgen(js_namespace = console)]
        fn warn(s: &str);
    }

    warn(&format!(
        "[LocalizeKit] Unknown language code '{}'. Unable to determine which language this represents.",
        code
    ));
}

#[cfg(not(target_arch = "wasm32"))]
pub fn warn_unknown_lang_code(code: &str) {
    eprintln!(
        "[LocalizeKit] Warning: Unknown language code '{}'. Unable to determine which language this represents.",
        code
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_known_codes() {
        assert!(is_known_lang_code("en"));
        assert!(is_known_lang_code("ko"));
        assert!(is_known_lang_code("ja"));
        assert!(is_known_lang_code("zh-CN"));
        assert!(is_known_lang_code("en-US"));
    }

    #[test]
    fn test_case_insensitive() {
        assert!(is_known_lang_code("EN"));
        assert!(is_known_lang_code("Ko"));
        assert!(is_known_lang_code("en-us"));
        assert!(is_known_lang_code("ZH-cn"));
        assert!(is_known_lang_code("zh_cn"));
        assert!(is_known_lang_code("EN_us"));
    }

    #[test]
    fn test_unknown_codes() {
        assert!(!is_known_lang_code("xx"));
        assert!(!is_known_lang_code("unknown"));
        assert!(!is_known_lang_code("en-XX"));
    }

    #[test]
    fn test_normalize() {
        assert_eq!(normalize_lang_code("EN"), "en");
        assert_eq!(normalize_lang_code("en-us"), "en-US");
        assert_eq!(normalize_lang_code("ZH-cn"), "zh-CN");
    }
}


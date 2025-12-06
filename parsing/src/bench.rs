//! 벤치마크 및 대용량 파일 테스트

#[cfg(test)]
mod tests {
    use crate::parser::csv::parse;
    use crate::parser::excel::parse as parse_excel;
    use crate::types::ParseOptions;
    use std::time::Instant;

    // ========================================================================
    // 소형 파일 테스트 (결과 검증)
    // ========================================================================

    #[test]
    fn test_small_csv() {
        let csv_data = include_bytes!("../test_files/small.csv");
        let options = ParseOptions::default();
        let result = parse(csv_data, &options).unwrap();

        assert_eq!(result.languages, vec!["en", "ko", "ja"]);
        assert_eq!(result.row_count, 10);

        // nested 구조 확인
        let en = result.data.get("en").unwrap();
        let common = en.get("common").unwrap().as_object().unwrap();
        assert_eq!(common.get("hello").unwrap(), "Hello");
        assert_eq!(common.get("goodbye").unwrap(), "Goodbye");

        println!("✅ small.csv: {} rows, {} languages", result.row_count, result.languages.len());
    }

    #[test]
    fn test_special_chars_csv() {
        let csv_data = include_bytes!("../test_files/special_chars.csv");
        let options = ParseOptions::default();
        let result = parse(csv_data, &options).unwrap();

        assert_eq!(result.languages, vec!["en", "ko", "ja"]);

        let en = result.data.get("en").unwrap();
        let message = en.get("message").unwrap().as_object().unwrap();

        // escape 시퀀스 확인
        let multiline = message.get("multiline").unwrap().as_str().unwrap();
        assert!(multiline.contains('\n'), "Should contain actual newline");

        // 변수 확인
        let variable = message.get("variable").unwrap().as_str().unwrap();
        assert!(variable.contains("{{name}}"), "Should preserve variable");

        // HTML 태그 확인
        let html = message.get("html").unwrap().as_str().unwrap();
        assert!(html.contains("<b>"), "Should preserve HTML tags");

        println!("✅ special_chars.csv: {} rows", result.row_count);
        println!("   - Multiline: {:?}", &multiline[..20.min(multiline.len())]);
        println!("   - Variable: {}", variable);
        println!("   - HTML: {}", html);
    }

    #[test]
    fn test_nested_deep_csv() {
        let csv_data = include_bytes!("../test_files/nested_deep.csv");
        let options = ParseOptions::default();
        let result = parse(csv_data, &options).unwrap();

        assert_eq!(result.languages, vec!["en", "ko", "ja"]);

        // 깊은 nested 구조 확인
        let en = result.data.get("en").unwrap();
        let app = en.get("app").unwrap().as_object().unwrap();
        let pages = app.get("pages").unwrap().as_object().unwrap();
        let home = pages.get("home").unwrap().as_object().unwrap();
        let hero = home.get("hero").unwrap().as_object().unwrap();
        let cta = hero.get("cta").unwrap().as_object().unwrap();

        assert_eq!(cta.get("primary").unwrap(), "Get Started");
        assert_eq!(cta.get("secondary").unwrap(), "Learn More");

        println!("✅ nested_deep.csv: {} rows, nested depth verified", result.row_count);
    }

    #[test]
    fn test_many_languages_csv() {
        let csv_data = include_bytes!("../test_files/many_languages.csv");
        let options = ParseOptions {
            nested: false, // flat keys
            ..Default::default()
        };
        let result = parse(csv_data, &options).unwrap();

        assert_eq!(result.languages.len(), 10);
        assert!(result.languages.contains(&"en".to_string()));
        assert!(result.languages.contains(&"ko".to_string()));
        assert!(result.languages.contains(&"ja".to_string()));
        assert!(result.languages.contains(&"zh-CN".to_string()));
        assert!(result.languages.contains(&"ru".to_string()));

        println!("✅ many_languages.csv: {} rows, {} languages", result.row_count, result.languages.len());
        println!("   Languages: {:?}", result.languages);
    }

    // ========================================================================
    // 대용량 파일 벤치마크 (시간 측정)
    // ========================================================================

    #[test]
    fn bench_medium_csv() {
        let csv_data = include_bytes!("../test_files/medium.csv");
        let options = ParseOptions::default();

        let start = Instant::now();
        let result = parse(csv_data, &options).unwrap();
        let elapsed = start.elapsed();

        println!("📊 medium.csv (100 rows, {} bytes)", csv_data.len());
        println!("   ⏱️  Time: {:?}", elapsed);
        println!("   📝 Rows: {}, Languages: {:?}", result.row_count, result.languages);

        assert_eq!(result.row_count, 100);
    }

    #[test]
    fn bench_large_csv() {
        let csv_data = include_bytes!("../test_files/large.csv");
        let options = ParseOptions::default();

        let start = Instant::now();
        let result = parse(csv_data, &options).unwrap();
        let elapsed = start.elapsed();

        println!("📊 large.csv (1,000 rows, {} bytes)", csv_data.len());
        println!("   ⏱️  Time: {:?}", elapsed);
        println!("   📝 Rows: {}, Languages: {:?}", result.row_count, result.languages);

        assert_eq!(result.row_count, 1000);
    }

    #[test]
    fn bench_xlarge_csv() {
        let csv_data = include_bytes!("../test_files/xlarge.csv");
        let options = ParseOptions::default();

        let start = Instant::now();
        let result = parse(csv_data, &options).unwrap();
        let elapsed = start.elapsed();

        println!("📊 xlarge.csv (5,000 rows, {} bytes)", csv_data.len());
        println!("   ⏱️  Time: {:?}", elapsed);
        println!("   📝 Rows: {}, Languages: {:?}", result.row_count, result.languages);

        assert_eq!(result.row_count, 5000);
    }

    #[test]
    fn bench_xxlarge_csv() {
        let csv_data = include_bytes!("../test_files/xxlarge.csv");
        let options = ParseOptions::default();

        let start = Instant::now();
        let result = parse(csv_data, &options).unwrap();
        let elapsed = start.elapsed();

        println!("📊 xxlarge.csv (10,000 rows, {} bytes)", csv_data.len());
        println!("   ⏱️  Time: {:?}", elapsed);
        println!("   📝 Rows: {}, Languages: {:?}", result.row_count, result.languages);

        assert_eq!(result.row_count, 10000);
    }

    #[test]
    fn bench_large_special_csv() {
        let csv_data = include_bytes!("../test_files/large_special.csv");
        let options = ParseOptions::default();

        let start = Instant::now();
        let result = parse(csv_data, &options).unwrap();
        let elapsed = start.elapsed();

        println!("📊 large_special.csv (1,000 rows with escapes, {} bytes)", csv_data.len());
        println!("   ⏱️  Time: {:?}", elapsed);
        println!("   📝 Rows: {}, Languages: {:?}", result.row_count, result.languages);

        assert_eq!(result.row_count, 1000);
    }

    // ========================================================================
    // 옵션별 성능 비교
    // ========================================================================

    #[test]
    fn bench_nested_vs_flat() {
        let csv_data = include_bytes!("../test_files/large.csv");

        // Nested
        let start = Instant::now();
        let result_nested = parse(csv_data, &ParseOptions {
            nested: true,
            ..Default::default()
        }).unwrap();
        let nested_time = start.elapsed();

        // Flat
        let start = Instant::now();
        let result_flat = parse(csv_data, &ParseOptions {
            nested: false,
            ..Default::default()
        }).unwrap();
        let flat_time = start.elapsed();

        println!("📊 Nested vs Flat (1,000 rows)");
        println!("   ⏱️  Nested: {:?}", nested_time);
        println!("   ⏱️  Flat:   {:?}", flat_time);

        assert_eq!(result_nested.row_count, result_flat.row_count);
    }

    #[test]
    fn bench_with_vs_without_escapes() {
        let csv_data = include_bytes!("../test_files/large_special.csv");

        // With escape processing
        let start = Instant::now();
        let _ = parse(csv_data, &ParseOptions {
            process_escapes: true,
            ..Default::default()
        }).unwrap();
        let with_escape_time = start.elapsed();

        // Without escape processing
        let start = Instant::now();
        let _ = parse(csv_data, &ParseOptions {
            process_escapes: false,
            ..Default::default()
        }).unwrap();
        let without_escape_time = start.elapsed();

        println!("📊 Escape Processing (1,000 rows with special chars)");
        println!("   ⏱️  With escapes:    {:?}", with_escape_time);
        println!("   ⏱️  Without escapes: {:?}", without_escape_time);
    }

    // ========================================================================
    // Separator rewrite 벤치마크 (CSV 텍스트)
    // ========================================================================

    #[test]
    fn bench_rewrite_separator_medium() {
        let csv_text = include_str!("../test_files/medium.csv");
        let start = Instant::now();
        let _out = crate::transform::rewrite_key_separator_in_csv(csv_text, "/");
        let elapsed = start.elapsed();
        println!(
            "📊 rewrite separator (medium.csv, {} bytes) -> {:?}",
            csv_text.len(),
            elapsed
        );
    }

    #[test]
    fn bench_rewrite_separator_large() {
        let csv_text = include_str!("../test_files/large.csv");
        let start = Instant::now();
        let _out = crate::transform::rewrite_key_separator_in_csv(csv_text, "/");
        let elapsed = start.elapsed();
        println!(
            "📊 rewrite separator (large.csv, {} bytes) -> {:?}",
            csv_text.len(),
            elapsed
        );
    }

    #[test]
    fn bench_rewrite_separator_xlarge() {
        let csv_text = include_str!("../test_files/xlarge.csv");
        let start = Instant::now();
        let _out = crate::transform::rewrite_key_separator_in_csv(csv_text, "/");
        let elapsed = start.elapsed();
        println!(
            "📊 rewrite separator (xlarge.csv, {} bytes) -> {:?}",
            csv_text.len(),
            elapsed
        );
    }

    #[test]
    fn bench_rewrite_separator_xxlarge() {
        let csv_text = include_str!("../test_files/xxlarge.csv");
        let start = Instant::now();
        let _out = crate::transform::rewrite_key_separator_in_csv(csv_text, "/");
        let elapsed = start.elapsed();
        println!(
            "📊 rewrite separator (xxlarge.csv, {} bytes) -> {:?}",
            csv_text.len(),
            elapsed
        );
    }

    // ========================================================================
    // Excel 벤치마크 (시간 측정)
    // ========================================================================

    #[test]
    fn bench_medium_excel() {
        let data = include_bytes!("../test_files/medium.xlsx");
        let options = ParseOptions::default();

        let start = Instant::now();
        let result = parse_excel(data, &options).unwrap();
        let elapsed = start.elapsed();

        println!("📊 medium.xlsx (100 rows, {} bytes)", data.len());
        println!("   ⏱️  Time: {:?}", elapsed);
        println!(
            "   📝 Rows: {}, Languages: {:?}",
            result.row_count, result.languages
        );

        assert_eq!(result.row_count, 100);
    }

    #[test]
    fn bench_large_excel() {
        let data = include_bytes!("../test_files/large.xlsx");
        let options = ParseOptions::default();

        let start = Instant::now();
        let result = parse_excel(data, &options).unwrap();
        let elapsed = start.elapsed();

        println!("📊 large.xlsx (1,000 rows, {} bytes)", data.len());
        println!("   ⏱️  Time: {:?}", elapsed);
        println!(
            "   📝 Rows: {}, Languages: {:?}",
            result.row_count, result.languages
        );

        assert_eq!(result.row_count, 1000);
    }

    #[test]
    fn bench_large_special_excel() {
        let data = include_bytes!("../test_files/large_special.xlsx");
        let options = ParseOptions::default();

        let start = Instant::now();
        let result = parse_excel(data, &options).unwrap();
        let elapsed = start.elapsed();

        println!(
            "📊 large_special.xlsx (1,000 rows with escapes, {} bytes)",
            data.len()
        );
        println!("   ⏱️  Time: {:?}", elapsed);
        println!(
            "   📝 Rows: {}, Languages: {:?}",
            result.row_count, result.languages
        );

        assert_eq!(result.row_count, 1000);
    }

    #[test]
    fn bench_xlarge_excel() {
        let data = include_bytes!("../test_files/xlarge.xlsx");
        let options = ParseOptions::default();

        let start = Instant::now();
        let result = parse_excel(data, &options).unwrap();
        let elapsed = start.elapsed();

        println!("📊 xlarge.xlsx (5,000 rows, {} bytes)", data.len());
        println!("   ⏱️  Time: {:?}", elapsed);
        println!(
            "   📝 Rows: {}, Languages: {:?}",
            result.row_count, result.languages
        );

        assert_eq!(result.row_count, 5000);
    }

    #[test]
    fn bench_xxlarge_excel() {
        let data = include_bytes!("../test_files/xxlarge.xlsx");
        let options = ParseOptions::default();

        let start = Instant::now();
        let result = parse_excel(data, &options).unwrap();
        let elapsed = start.elapsed();

        println!("📊 xxlarge.xlsx (10,000 rows, {} bytes)", data.len());
        println!("   ⏱️  Time: {:?}", elapsed);
        println!(
            "   📝 Rows: {}, Languages: {:?}",
            result.row_count, result.languages
        );

        assert_eq!(result.row_count, 10000);
    }

    #[test]
    fn test_excel_to_csv() {
        let data = include_bytes!("../test_files/medium.xlsx");
        let csv = crate::parser::excel::to_csv(data).unwrap();
        assert!(!csv.is_empty());
        println!("✅ excel_to_csv ok (medium.xlsx)");
    }
}


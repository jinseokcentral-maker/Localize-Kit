use crate::error::{ParseError, Result};
use crate::lang_codes::normalize_lang_code;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};

/// Input for each language JSON payload
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LangJsonInput {
    /// Language code (e.g., "en", "ko", "ja")
    #[serde(alias = "lang")]
    pub language: String,
    /// JSON content as string
    #[serde(alias = "data")]
    pub content: String,
}

/// Table representation used to build CSV/Excel
#[derive(Debug, Clone, Serialize)]
pub struct TableData {
    pub header: Vec<String>,
    pub rows: Vec<Vec<String>>,
}

/// Flatten a JSON value into dot-separated keys
fn flatten_value(prefix: &str, value: &Value, separator: &str, out: &mut BTreeMap<String, Value>) {
    match value {
        Value::Object(map) => {
            for (k, v) in map {
                let next_prefix = if prefix.is_empty() {
                    k.to_string()
                } else {
                    format!("{prefix}{separator}{k}")
                };
                flatten_value(&next_prefix, v, separator, out);
            }
        }
        other => {
            out.insert(prefix.to_string(), other.clone());
        }
    }
}

fn value_to_cell(value: &Value) -> String {
    match value {
        Value::String(s) => s.clone(),
        Value::Null => String::new(),
        other => other.to_string(),
    }
}

/// Merge multiple JSON locale files into a tabular form.
/// Missing translations are filled with an empty string.
pub fn merge_jsons_to_table(inputs: &[LangJsonInput], separator: &str) -> Result<TableData> {
    if inputs.is_empty() {
        return Err(ParseError::empty_data().with_suggestion(
            "Provide at least one JSON input with language and content",
        ));
    }

    let mut languages: Vec<String> = Vec::with_capacity(inputs.len());
    let mut seen = HashSet::new();
    let mut lang_data: HashMap<String, BTreeMap<String, Value>> = HashMap::new();

    for input in inputs {
        let lang = normalize_lang_code(&input.language);
        if !seen.insert(lang.clone()) {
            return Err(ParseError::new(
                crate::error::ErrorKind::Unknown,
                format!("Duplicate language provided: '{}'", lang),
            )
            .with_suggestion("Provide each language only once"));
        }
        languages.push(lang.clone());

        let value: Value = serde_json::from_str(&input.content)
            .map_err(|e| ParseError::json_parse_error(&input.language, e))?;

        let root = value
            .as_object()
            .ok_or_else(|| ParseError::invalid_json_root(&input.language))?;

        let mut flat = BTreeMap::new();
        flatten_value("", &Value::Object(root.clone()), separator, &mut flat);
        lang_data.insert(lang, flat);
    }

    // Collect all keys across languages (sorted)
    let mut all_keys: BTreeSet<String> = BTreeSet::new();
    for map in lang_data.values() {
        for key in map.keys() {
            all_keys.insert(key.clone());
        }
    }

    // Build rows: key + per-language value
    let mut rows: Vec<Vec<String>> = Vec::with_capacity(all_keys.len());
    for key in all_keys {
        let mut row = Vec::with_capacity(languages.len() + 1);
        row.push(key.clone());
        for lang in &languages {
            let val = lang_data
                .get(lang)
                .and_then(|m| m.get(&key))
                .map(value_to_cell)
                .unwrap_or_default();
            row.push(val);
        }
        rows.push(row);
    }

    let mut header = Vec::with_capacity(languages.len() + 1);
    header.push("key".to_string());
    header.extend(languages);

    Ok(TableData { header, rows })
}

/// Convert the merged table into a CSV string.
pub fn merge_jsons_to_csv(inputs: &[LangJsonInput], separator: &str) -> Result<String> {
    let table = merge_jsons_to_table(inputs, separator)?;
    let mut writer = csv::Writer::from_writer(Vec::new());

    writer
        .write_record(&table.header)
        .map_err(|e| ParseError::csv_parse_error(&e))?;

    for row in table.rows {
        writer
            .write_record(&row)
            .map_err(|e| ParseError::csv_parse_error(&e))?;
    }

    let data = writer
        .into_inner()
        .map_err(|e| ParseError::io_error(&std::io::Error::new(std::io::ErrorKind::Other, e.to_string())))?;

    String::from_utf8(data).map_err(|e| ParseError::utf8_error(&e.utf8_error()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::Map;

    fn build_lang_content(prefix: &str, count: usize, skip_even: bool) -> String {
        let mut map = Map::new();
        for i in 0..count {
            if skip_even && i % 2 == 0 {
                continue;
            }
            map.insert(
                format!("{prefix}{i}"),
                Value::String(format!("value-{i}")),
            );
        }
        serde_json::to_string(&Value::Object(map)).unwrap()
    }

    #[test]
    fn merges_and_fills_missing_values() {
        let inputs = vec![
            LangJsonInput {
                language: "en".to_string(),
                content: r#"{"app":{"hello":"Hello","bye":"Bye"}}"#.to_string(),
            },
            LangJsonInput {
                language: "ko".to_string(),
                content: r#"{"app":{"hello":"안녕"}}"#.to_string(),
            },
        ];

        let table = merge_jsons_to_table(&inputs, ".").unwrap();
        assert_eq!(table.header, vec!["key", "en", "ko"]);
        // keys sorted alphabetically
        assert_eq!(table.rows[0][0], "app.bye");
        assert_eq!(table.rows[0][1], "Bye");
        assert_eq!(table.rows[0][2], "");
        assert_eq!(table.rows[1][0], "app.hello");
        assert_eq!(table.rows[1][1], "Hello");
        assert_eq!(table.rows[1][2], "안녕");

        let csv = merge_jsons_to_csv(&inputs, ".").unwrap();
        assert!(csv.contains("app.bye,Bye,"));
        assert!(csv.contains("app.hello,Hello,안녕"));
    }

    #[test]
    fn rejects_non_object_root() {
        let inputs = vec![LangJsonInput {
            language: "en".to_string(),
            content: r#"[{"hello":"world"}]"#.to_string(),
        }];

        let err = merge_jsons_to_table(&inputs, ".").unwrap_err();
        assert_eq!(err.kind, crate::error::ErrorKind::JsonParseError);
    }

    #[test]
    fn merges_large_dataset_and_fills_missing() {
        let count = 2000;
        let inputs = vec![
            LangJsonInput {
                language: "en".to_string(),
                content: build_lang_content("k", count, false), // full set
            },
            LangJsonInput {
                language: "ko".to_string(),
                content: build_lang_content("k", count, true), // only odd keys
            },
        ];

        let table = merge_jsons_to_table(&inputs, ".").unwrap();
        assert_eq!(table.header, vec!["key", "en", "ko"]);
        assert_eq!(table.rows.len(), count); // all keys retained (BTreeSet)

        // k0 should exist, ko missing -> empty string
        let k0 = table
            .rows
            .iter()
            .find(|row| row[0] == "k0")
            .expect("k0 missing");
        assert_eq!(k0[1], "value-0");
        assert_eq!(k0[2], "");

        // k1 should exist in both
        let k1 = table
            .rows
            .iter()
            .find(|row| row[0] == "k1")
            .expect("k1 missing");
        assert_eq!(k1[1], "value-1");
        assert_eq!(k1[2], "value-1");
    }
}


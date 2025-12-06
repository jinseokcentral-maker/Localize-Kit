//! Error types for the parsing library
//!
//! Provides detailed error information including:
//! - Error type and message
//! - Location (row, column, key)
//! - Suggestions for fixing

use std::fmt;

/// Result type alias using ParseError
pub type Result<T> = std::result::Result<T, ParseError>;

/// Main error type for parsing operations
#[derive(Debug, Clone)]
pub struct ParseError {
    /// The kind of error
    pub kind: ErrorKind,
    /// Human-readable error message
    pub message: String,
    /// Optional location information
    pub location: Option<ErrorLocation>,
    /// Optional suggestion for fixing
    pub suggestion: Option<String>,
}

/// Error location information
#[derive(Debug, Clone)]
pub struct ErrorLocation {
    /// Row number (1-based, 0 = header)
    pub row: Option<usize>,
    /// Column number (1-based)
    pub column: Option<usize>,
    /// Column name (language code)
    pub column_name: Option<String>,
    /// Key name
    pub key: Option<String>,
}

/// Specific error types
#[derive(Debug, Clone, PartialEq)]
pub enum ErrorKind {
    // Header errors
    EmptyData,
    InvalidKeyColumn,
    NoLanguageColumns,
    MixedSeparators,
    
    // CSV parsing errors
    CsvParseError,
    Utf8Error,
    
    // Excel parsing errors
    ExcelOpenError,
    EmptyWorkbook,
    EmptySheet,
    WorksheetReadError,
    
    // Data validation errors
    DuplicateKey,
    InvalidKeyFormat,
    MissingTranslation,
    ColumnCountMismatch,
    
    // Conversion errors
    NestedKeyConflict,
    JsonSerializeError,
    YamlSerializeError,
    
    // Generic errors
    IoError,
    Unknown,
}

impl ParseError {
    /// Create a new error with just kind and message
    pub fn new(kind: ErrorKind, message: impl Into<String>) -> Self {
        Self {
            kind,
            message: message.into(),
            location: None,
            suggestion: None,
        }
    }

    /// Add location information
    pub fn with_location(mut self, location: ErrorLocation) -> Self {
        self.location = Some(location);
        self
    }

    /// Add a suggestion
    pub fn with_suggestion(mut self, suggestion: impl Into<String>) -> Self {
        self.suggestion = Some(suggestion.into());
        self
    }

    /// Add row information
    pub fn at_row(mut self, row: usize) -> Self {
        if let Some(ref mut loc) = self.location {
            loc.row = Some(row);
        } else {
            self.location = Some(ErrorLocation {
                row: Some(row),
                column: None,
                column_name: None,
                key: None,
            });
        }
        self
    }

    /// Add column information
    pub fn at_column(mut self, column: usize, name: Option<String>) -> Self {
        if let Some(ref mut loc) = self.location {
            loc.column = Some(column);
            loc.column_name = name;
        } else {
            self.location = Some(ErrorLocation {
                row: None,
                column: Some(column),
                column_name: name,
                key: None,
            });
        }
        self
    }

    /// Add key information
    pub fn with_key(mut self, key: impl Into<String>) -> Self {
        if let Some(ref mut loc) = self.location {
            loc.key = Some(key.into());
        } else {
            self.location = Some(ErrorLocation {
                row: None,
                column: None,
                column_name: None,
                key: Some(key.into()),
            });
        }
        self
    }
}

// ============================================================================
// Error constructors for common errors
// ============================================================================

impl ParseError {
    /// Empty CSV/Excel data
    pub fn empty_data() -> Self {
        Self::new(ErrorKind::EmptyData, "The input data is empty")
            .with_suggestion("Provide a CSV or Excel file with at least a header row and one data row")
    }

    /// Invalid key column (first column is not "key")
    pub fn invalid_key_column(found: &str) -> Self {
        Self::new(
            ErrorKind::InvalidKeyColumn,
            format!("Invalid header: first column must be 'key', but found '{}'", found),
        )
        .with_location(ErrorLocation {
            row: Some(0),
            column: Some(1),
            column_name: Some(found.to_string()),
            key: None,
        })
        .with_suggestion("Rename the first column to 'key' (case-insensitive)")
    }

    /// No language columns found
    pub fn no_language_columns() -> Self {
        Self::new(
            ErrorKind::NoLanguageColumns,
            "No language columns found in header",
        )
        .at_row(0)
        .with_suggestion("Add language columns after 'key' column (e.g., 'en', 'ko', 'ja')")
    }

    /// Mixed or invalid separators in key column
    pub fn mixed_separators(found: Vec<char>, expected: &str, row: Option<usize>) -> Self {
        let mut separators: Vec<String> = found.iter().map(|c| c.to_string()).collect();
        separators.sort();
        separators.dedup();

        let mut msg = format!(
            "Mixed key separators found: expected '{}', but found: {}",
            expected,
            separators.join(", ")
        );
        if let Some(r) = row {
            msg = format!("{} (row {})", msg, r);
        }

        let mut err = Self::new(ErrorKind::MixedSeparators, msg)
            .with_suggestion("Use a single separator consistently ('.', '/', or '-')");

        // 위치 정보: key 컬럼(1열)
        let loc = ErrorLocation {
            row,
            column: Some(1),
            column_name: Some("key".to_string()),
            key: None,
        };
        err = err.with_location(loc);

        err
    }

    /// Column count mismatch (row has different number of columns than header)
    pub fn column_count_mismatch(row: usize, expected: usize, found: usize) -> Self {
        // row is 1-based including header (caller should supply)
        let msg = format!(
            "Column count mismatch: expected {} columns (from header), but found {} (row {})",
            expected, found, row
        );
        Self::new(ErrorKind::ColumnCountMismatch, msg)
            .with_location(ErrorLocation {
                row: Some(row),
                column: None,
                column_name: None,
                key: None,
            })
            .with_suggestion("Ensure each row has the same number of columns as the header")
    }

    /// CSV parsing error
    pub fn csv_parse_error(err: &csv::Error) -> Self {
        let (row, _col) = match err.position() {
            // csv::Position::line() is 1-based including header
            Some(pos) => (Some(pos.line() as usize), Some(pos.byte() as usize)),
            None => (None, None),
        };

        let mut msg = format!("CSV parsing error: {}", err);
        if let Some(r) = row {
            msg = format!("{} (row {})", msg, r);
        }

        let mut error = Self::new(ErrorKind::CsvParseError, msg)
            .with_suggestion("Check for unescaped quotes, mismatched columns, or invalid CSV format");

        if let Some(r) = row {
            // location: row, unknown column
            error = error.with_location(ErrorLocation {
                row: Some(r),
                column: None,
                column_name: None,
                key: None,
            });
        }

        error
    }

    /// UTF-8 encoding error
    pub fn utf8_error(err: &std::str::Utf8Error) -> Self {
        Self::new(
            ErrorKind::Utf8Error,
            format!("Invalid UTF-8 encoding at byte {}", err.valid_up_to()),
        )
        .with_suggestion("Ensure the file is saved with UTF-8 encoding")
    }

    /// Excel file open error
    pub fn excel_open_error(details: &str) -> Self {
        Self::new(
            ErrorKind::ExcelOpenError,
            format!("Failed to open Excel file: {}", details),
        )
        .with_suggestion("Ensure the file is a valid .xlsx or .xls file and is not corrupted")
    }

    /// Empty Excel workbook
    pub fn empty_workbook() -> Self {
        Self::new(ErrorKind::EmptyWorkbook, "Excel workbook has no sheets")
            .with_suggestion("Add at least one sheet with translation data")
    }

    /// Empty Excel sheet
    pub fn empty_sheet() -> Self {
        Self::new(ErrorKind::EmptySheet, "Excel sheet is empty")
            .with_suggestion("Add header row and data rows to the sheet")
    }

    /// Worksheet read error
    pub fn worksheet_read_error(sheet_name: &str, details: &str) -> Self {
        Self::new(
            ErrorKind::WorksheetReadError,
            format!("Failed to read worksheet '{}': {}", sheet_name, details),
        )
    }

    /// Duplicate key found
    pub fn duplicate_key(key: &str, first_row: usize, duplicate_row: usize) -> Self {
        Self::new(
            ErrorKind::DuplicateKey,
            format!(
                "Duplicate key '{}' found at row {} (first occurrence at row {})",
                key, duplicate_row, first_row
            ),
        )
        .with_key(key)
        .at_row(duplicate_row)
        .with_suggestion("Remove or rename the duplicate key")
    }

    /// Invalid key format
    pub fn invalid_key_format(key: &str, row: usize, reason: &str) -> Self {
        Self::new(
            ErrorKind::InvalidKeyFormat,
            format!("Invalid key '{}' at row {}: {}", key, row, reason),
        )
        .with_key(key)
        .at_row(row)
    }

    /// Missing translation
    pub fn missing_translation(key: &str, language: &str, row: usize) -> Self {
        Self::new(
            ErrorKind::MissingTranslation,
            format!(
                "Missing translation for key '{}' in language '{}' at row {}",
                key, language, row
            ),
        )
        .with_key(key)
        .at_row(row)
        .at_column(0, Some(language.to_string()))
    }

    /// Nested key conflict
    pub fn nested_key_conflict(key1: &str, key2: &str) -> Self {
        Self::new(
            ErrorKind::NestedKeyConflict,
            format!(
                "Nested key conflict: '{}' and '{}' cannot coexist (one is a prefix of the other)",
                key1, key2
            ),
        )
        .with_suggestion("Rename one of the keys to avoid the conflict")
    }

    /// JSON serialization error
    pub fn json_serialize_error(err: serde_json::Error) -> Self {
        Self::new(
            ErrorKind::JsonSerializeError,
            format!("Failed to serialize to JSON: {}", err),
        )
    }

    /// YAML serialization error
    pub fn yaml_serialize_error(err: serde_yaml::Error) -> Self {
        Self::new(
            ErrorKind::YamlSerializeError,
            format!("Failed to serialize to YAML: {}", err),
        )
    }

    /// Generic IO error
    pub fn io_error(err: &std::io::Error) -> Self {
        Self::new(ErrorKind::IoError, format!("IO error: {}", err))
    }
}

// ============================================================================
// Display and Error trait implementations
// ============================================================================

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}] {}", self.kind, self.message)?;

        if let Some(ref loc) = self.location {
            let mut parts = Vec::new();
            if let Some(row) = loc.row {
                parts.push(format!("row {}", row + 1)); // Convert to 1-based
            }
            if let Some(col) = loc.column {
                if let Some(ref name) = loc.column_name {
                    parts.push(format!("column {} ('{}')", col, name));
                } else {
                    parts.push(format!("column {}", col));
                }
            }
            if let Some(ref key) = loc.key {
                parts.push(format!("key '{}'", key));
            }
            if !parts.is_empty() {
                write!(f, " at {}", parts.join(", "))?;
            }
        }

        if let Some(ref suggestion) = self.suggestion {
            write!(f, ". Suggestion: {}", suggestion)?;
        }

        Ok(())
    }
}

impl fmt::Display for ErrorKind {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let name = match self {
            ErrorKind::EmptyData => "EMPTY_DATA",
            ErrorKind::InvalidKeyColumn => "INVALID_KEY_COLUMN",
            ErrorKind::NoLanguageColumns => "NO_LANGUAGE_COLUMNS",
            ErrorKind::MixedSeparators => "MIXED_SEPARATORS",
            ErrorKind::CsvParseError => "CSV_PARSE_ERROR",
            ErrorKind::Utf8Error => "UTF8_ERROR",
            ErrorKind::ExcelOpenError => "EXCEL_OPEN_ERROR",
            ErrorKind::EmptyWorkbook => "EMPTY_WORKBOOK",
            ErrorKind::EmptySheet => "EMPTY_SHEET",
            ErrorKind::WorksheetReadError => "WORKSHEET_READ_ERROR",
            ErrorKind::DuplicateKey => "DUPLICATE_KEY",
            ErrorKind::InvalidKeyFormat => "INVALID_KEY_FORMAT",
            ErrorKind::MissingTranslation => "MISSING_TRANSLATION",
            ErrorKind::ColumnCountMismatch => "COLUMN_COUNT_MISMATCH",
            ErrorKind::NestedKeyConflict => "NESTED_KEY_CONFLICT",
            ErrorKind::JsonSerializeError => "JSON_SERIALIZE_ERROR",
            ErrorKind::YamlSerializeError => "YAML_SERIALIZE_ERROR",
            ErrorKind::IoError => "IO_ERROR",
            ErrorKind::Unknown => "UNKNOWN_ERROR",
        };
        write!(f, "{}", name)
    }
}

impl std::error::Error for ParseError {}

// ============================================================================
// Conversions from other error types
// ============================================================================

impl From<csv::Error> for ParseError {
    fn from(err: csv::Error) -> Self {
        ParseError::csv_parse_error(&err)
    }
}

impl From<std::str::Utf8Error> for ParseError {
    fn from(err: std::str::Utf8Error) -> Self {
        ParseError::utf8_error(&err)
    }
}

impl From<serde_json::Error> for ParseError {
    fn from(err: serde_json::Error) -> Self {
        ParseError::json_serialize_error(err)
    }
}

impl From<std::io::Error> for ParseError {
    fn from(err: std::io::Error) -> Self {
        ParseError::io_error(&err)
    }
}

impl From<calamine::Error> for ParseError {
    fn from(err: calamine::Error) -> Self {
        ParseError::new(
            ErrorKind::ExcelOpenError,
            format!("Excel error: {}", err),
        )
    }
}

// ============================================================================
// JSON serialization for WASM
// ============================================================================

impl ParseError {
    /// Convert to JSON string for WASM
    pub fn to_json(&self) -> String {
        serde_json::json!({
            "error": true,
            "kind": self.kind.to_string(),
            "message": self.message,
            "location": self.location.as_ref().map(|loc| {
                serde_json::json!({
                    "row": loc.row.map(|r| r + 1), // 1-based for display
                    "column": loc.column,
                    "columnName": loc.column_name,
                    "key": loc.key,
                })
            }),
            "suggestion": self.suggestion,
            "fullMessage": self.to_string(),
        })
        .to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_data_error() {
        let err = ParseError::empty_data();
        assert_eq!(err.kind, ErrorKind::EmptyData);
        assert!(err.suggestion.is_some());
        println!("{}", err);
    }

    #[test]
    fn test_invalid_key_column_error() {
        let err = ParseError::invalid_key_column("id");
        assert_eq!(err.kind, ErrorKind::InvalidKeyColumn);
        assert!(err.location.is_some());
        let loc = err.location.as_ref().unwrap();
        assert_eq!(loc.row, Some(0));
        println!("{}", err);
    }

    #[test]
    fn test_duplicate_key_error() {
        let err = ParseError::duplicate_key("common.hello", 5, 15);
        assert_eq!(err.kind, ErrorKind::DuplicateKey);
        println!("{}", err);
    }

    #[test]
    fn test_error_to_json() {
        let err = ParseError::invalid_key_column("id");
        let json = err.to_json();
        println!("{}", json);
        assert!(json.contains("INVALID_KEY_COLUMN"));
        assert!(json.contains("\"row\":1")); // 1-based
    }

    #[test]
    fn test_error_chaining() {
        let err = ParseError::new(ErrorKind::InvalidKeyFormat, "Key contains invalid characters")
            .with_key("hello world")
            .at_row(10)
            .with_suggestion("Remove spaces from key names");

        println!("{}", err);
        assert!(err.to_string().contains("row 11")); // 1-based
        assert!(err.to_string().contains("hello world"));
    }
}

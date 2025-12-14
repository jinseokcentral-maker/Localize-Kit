/**
 * Editor utility functions
 * Pure functions for CSV/JSON processing logic
 */

export type Separator = "." | "/" | "-";

/**
 * Extract language codes from CSV header
 * @param csv - CSV content string
 * @returns Array of language codes (excluding 'key' column)
 */
export function extractLanguages(csv: string): string[] {
    const firstLine = csv.trim().split("\n")[0];
    if (!firstLine) return [];

    const headers = firstLine.split(",").map((h) => h.trim());
    return headers.filter((h) => h.toLowerCase() !== "key").map((h) => h); // 원본 케이스 유지
}

/**
 * Resolve language key from available keys
 * Normalizes language keys for comparison (lowercase, replace _ with -)
 * @param targetLanguage - Target language to find
 * @param availableKeys - Array of available language keys
 * @returns Resolved language key or undefined
 */
export function resolveLanguageKey(
    targetLanguage: string,
    availableKeys: string[],
): string | undefined {
    const target = targetLanguage.toLowerCase().replace("_", "-");
    return availableKeys.find((key) => {
        const normalized = key.toLowerCase().replace("_", "-");
        return normalized === target;
    });
}

/**
 * Check if file is Excel format
 * @param fileName - File name
 * @returns true if Excel file
 */
export function isExcelFile(fileName: string): boolean {
    const name = fileName.toLowerCase();
    return name.endsWith(".xlsx") || name.endsWith(".xls");
}

/**
 * Check if file is CSV format
 * @param fileName - File name
 * @returns true if CSV file
 */
export function isCsvFile(fileName: string): boolean {
    const name = fileName.toLowerCase();
    return name.endsWith(".csv");
}

/**
 * Validate file type
 * @param fileName - File name
 * @returns true if valid (CSV or Excel)
 */
export function isValidFileType(fileName: string): boolean {
    return isExcelFile(fileName) || isCsvFile(fileName);
}

/**
 * Get current language from active language or fallback
 * @param activeLanguage - Active language from query string
 * @param languages - Available languages array
 * @param fallback - Fallback language (default: "en")
 * @returns Current language in lowercase
 */
export function getCurrentLanguage(
    activeLanguage: string | null,
    languages: string[],
    fallback: string = "en",
): string {
    const currentLanguageRaw = activeLanguage || languages[0] || fallback;
    return currentLanguageRaw.toLowerCase();
}

/**
 * Format JSON output for display/download
 */
export function formatJsonOutput(
    json: Record<string, unknown>,
): { text: string; ext: string; mime: string } {
    return {
        text: JSON.stringify(json, null, 2),
        ext: "json",
        mime: "application/json",
    };
}

/**
 * Convert CSV string to 2D array
 * @param csv - CSV content string
 * @returns 2D array of strings (rows x columns)
 */
export function csvTo2D(csv: string): string[][] {
    if (!csv.trim()) return [];
    const lines = csv.replace(/\r\n/g, "\n").split("\n");
    return lines
        .filter((l, i) => l.trim().length > 0 || i === 0)
        .map((line) => line.split(","));
}

/**
 * Parse CSV into headers and rows
 */
export function parseCsvData(csv: string): {
    headers: string[];
    rows: string[][];
} {
    const twoD = csvTo2D(csv);
    const headers = twoD[0] ?? [];
    const rows = twoD.slice(1);
    return { headers, rows };
}


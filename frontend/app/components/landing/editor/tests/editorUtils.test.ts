/**
 * Unit tests for editor utility functions
 *
 * To run these tests, you'll need to install a test framework:
 * pnpm add -D vitest @vitest/ui
 *
 * Then add to package.json:
 * "test": "vitest",
 * "test:ui": "vitest --ui"
 */

import { describe, expect, it } from "vitest";
import {
    extractLanguages,
    formatJsonOutput,
    getCurrentLanguage,
    isCsvFile,
    isExcelFile,
    isValidFileType,
    resolveLanguageKey,
} from "../utils/editorUtils";

describe("extractLanguages", () => {
    it("should extract language codes from CSV header", () => {
        const csv = "key,en,ko,ja\ncommon.hello,Hello,안녕하세요,こんにちは";
        const result = extractLanguages(csv);
        expect(result).toEqual(["en", "ko", "ja"]);
    });

    it("should exclude 'key' column from languages", () => {
        const csv = "key,en,ko\nhello,Hello,안녕하세요";
        const result = extractLanguages(csv);
        expect(result).toEqual(["en", "ko"]);
        expect(result).not.toContain("key");
    });

    it("should preserve original case of language codes", () => {
        const csv = "key,EN,Ko,ja_JP\nhello,Hello,Hola,Konichiwa";
        const result = extractLanguages(csv);
        expect(result).toEqual(["EN", "Ko", "ja_JP"]);
    });

    it("should handle empty CSV", () => {
        const csv = "";
        const result = extractLanguages(csv);
        expect(result).toEqual([]);
    });

    it("should handle CSV with only key column", () => {
        const csv = "key\nhello";
        const result = extractLanguages(csv);
        expect(result).toEqual([]);
    });

    it("should trim whitespace from headers", () => {
        const csv = "key, en , ko , ja \nhello,Hello,안녕,こん";
        const result = extractLanguages(csv);
        expect(result).toEqual(["en", "ko", "ja"]);
    });
});

describe("resolveLanguageKey", () => {
    it("should find exact match", () => {
        const availableKeys = ["en", "ko", "ja"];
        const result = resolveLanguageKey("en", availableKeys);
        expect(result).toBe("en");
    });

    it("should normalize and find match (lowercase)", () => {
        const availableKeys = ["EN", "KO", "JA"];
        const result = resolveLanguageKey("en", availableKeys);
        expect(result).toBe("EN");
    });

    it("should normalize underscore to hyphen", () => {
        const availableKeys = ["en-US", "ko-KR", "ja-JP"];
        const result = resolveLanguageKey("en_US", availableKeys);
        expect(result).toBe("en-US");
    });

    it("should return undefined if no match found", () => {
        const availableKeys = ["en", "ko", "ja"];
        const result = resolveLanguageKey("fr", availableKeys);
        expect(result).toBeUndefined();
    });

    it("should handle empty available keys", () => {
        const result = resolveLanguageKey("en", []);
        expect(result).toBeUndefined();
    });

    it("should handle case-insensitive matching", () => {
        const availableKeys = ["en", "ko", "ja"];
        const result = resolveLanguageKey("EN", availableKeys);
        expect(result).toBe("en");
    });
});

describe("isExcelFile", () => {
    it("should return true for .xlsx files", () => {
        expect(isExcelFile("test.xlsx")).toBe(true);
        expect(isExcelFile("TEST.XLSX")).toBe(true);
        expect(isExcelFile("file.name.xlsx")).toBe(true);
    });

    it("should return true for .xls files", () => {
        expect(isExcelFile("test.xls")).toBe(true);
        expect(isExcelFile("TEST.XLS")).toBe(true);
    });

    it("should return false for non-Excel files", () => {
        expect(isExcelFile("test.csv")).toBe(false);
        expect(isExcelFile("test.txt")).toBe(false);
        expect(isExcelFile("test.xlsx.backup")).toBe(false);
    });
});

describe("isCsvFile", () => {
    it("should return true for .csv files", () => {
        expect(isCsvFile("test.csv")).toBe(true);
        expect(isCsvFile("TEST.CSV")).toBe(true);
        expect(isCsvFile("file.name.csv")).toBe(true);
    });

    it("should return false for non-CSV files", () => {
        expect(isCsvFile("test.xlsx")).toBe(false);
        expect(isCsvFile("test.txt")).toBe(false);
        expect(isCsvFile("test.csv.backup")).toBe(false);
    });
});

describe("isValidFileType", () => {
    it("should return true for Excel files", () => {
        expect(isValidFileType("test.xlsx")).toBe(true);
        expect(isValidFileType("test.xls")).toBe(true);
    });

    it("should return true for CSV files", () => {
        expect(isValidFileType("test.csv")).toBe(true);
    });

    it("should return false for invalid file types", () => {
        expect(isValidFileType("test.txt")).toBe(false);
        expect(isValidFileType("test.pdf")).toBe(false);
        expect(isValidFileType("test")).toBe(false);
    });
});

describe("getCurrentLanguage", () => {
    it("should return active language if provided", () => {
        const languages = ["en", "ko", "ja"];
        const result = getCurrentLanguage("ko", languages);
        expect(result).toBe("ko");
    });

    it("should return first language if active is null", () => {
        const languages = ["en", "ko", "ja"];
        const result = getCurrentLanguage(null, languages);
        expect(result).toBe("en");
    });

    it("should return fallback if languages array is empty", () => {
        const result = getCurrentLanguage(null, [], "fr");
        expect(result).toBe("fr");
    });

    it("should return default fallback 'en' if not specified", () => {
        const result = getCurrentLanguage(null, []);
        expect(result).toBe("en");
    });

    it("should convert to lowercase", () => {
        const languages = ["EN", "KO", "JA"];
        const result = getCurrentLanguage("KO", languages);
        expect(result).toBe("ko");
    });

    it("should handle mixed case", () => {
        const languages = ["en", "Ko", "ja"];
        const result = getCurrentLanguage("Ko", languages);
        expect(result).toBe("ko");
    });
});

describe("formatJsonOutput", () => {
    it("should format JSON with proper structure", () => {
        const json = { hello: "world", nested: { key: "value" } };
        const result = formatJsonOutput(json);

        expect(result.ext).toBe("json");
        expect(result.mime).toBe("application/json");
        expect(result.text).toBe(JSON.stringify(json, null, 2));
    });

    it("should handle empty object", () => {
        const json = {};
        const result = formatJsonOutput(json);

        expect(result.text).toBe("{}");
        expect(result.ext).toBe("json");
        expect(result.mime).toBe("application/json");
    });

    it("should format with 2-space indentation", () => {
        const json = { key: "value" };
        const result = formatJsonOutput(json);

        const lines = result.text.split("\n");
        expect(lines.length).toBeGreaterThan(1);
        expect(result.text).toContain('  "key"');
    });

    it("should handle complex nested structures", () => {
        const json = {
            en: {
                common: {
                    hello: "Hello",
                    goodbye: "Goodbye",
                },
            },
        };
        const result = formatJsonOutput(json);

        expect(result.text).toContain("common");
        expect(result.text).toContain("hello");
        expect(JSON.parse(result.text)).toEqual(json);
    });
});


/**
 * Unit tests for ExcelView utility functions
 */

import { describe, expect, it } from "vitest";
import { csvTo2D, parseCsvData, createGridColumns } from "../ExcelView";

describe("csvTo2D", () => {
  it("should convert simple CSV to 2D array", () => {
    const csv = "key,en,ko\nhello,Hello,안녕";
    const result = csvTo2D(csv);
    expect(result).toEqual([
      ["key", "en", "ko"],
      ["hello", "Hello", "안녕"],
    ]);
  });

  it("should handle Windows line endings", () => {
    const csv = "key,en\r\nhello,Hello";
    const result = csvTo2D(csv);
    expect(result).toEqual([
      ["key", "en"],
      ["hello", "Hello"],
    ]);
  });

  it("should preserve empty first line (header)", () => {
    const csv = "key,en,ko\n";
    const result = csvTo2D(csv);
    expect(result).toEqual([["key", "en", "ko"]]);
  });

  it("should filter out empty lines except first", () => {
    const csv = "key,en,ko\n\nhello,Hello,안녕\n\nworld,World,세상";
    const result = csvTo2D(csv);
    expect(result).toEqual([
      ["key", "en", "ko"],
      ["hello", "Hello", "안녕"],
      ["world", "World", "세상"],
    ]);
  });

  it("should handle empty CSV", () => {
    const result = csvTo2D("");
    expect(result).toEqual([]);
  });

  it("should handle CSV with only headers", () => {
    const csv = "key,en,ko";
    const result = csvTo2D(csv);
    expect(result).toEqual([["key", "en", "ko"]]);
  });
});

describe("parseCsvData", () => {
  it("should parse CSV into headers and rows", () => {
    const csv = "key,en,ko\nhello,Hello,안녕\nworld,World,세상";
    const result = parseCsvData(csv);
    expect(result.headers).toEqual(["key", "en", "ko"]);
    expect(result.rows).toEqual([
      ["hello", "Hello", "안녕"],
      ["world", "World", "세상"],
    ]);
  });

  it("should handle empty CSV", () => {
    const result = parseCsvData("");
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it("should handle CSV with only headers", () => {
    const csv = "key,en,ko";
    const result = parseCsvData(csv);
    expect(result.headers).toEqual(["key", "en", "ko"]);
    expect(result.rows).toEqual([]);
  });

  it("should handle CSV with one row", () => {
    const csv = "key,en\nhello,Hello";
    const result = parseCsvData(csv);
    expect(result.headers).toEqual(["key", "en"]);
    expect(result.rows).toEqual([["hello", "Hello"]]);
  });
});

describe("createGridColumns", () => {
  it("should create grid columns from headers", () => {
    const headers = ["key", "en", "ko"];
    const result = createGridColumns(headers);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      title: "key",
      width: 200,
      grow: 1,
    });
    expect(result[1]).toEqual({
      title: "en",
      width: 200,
      grow: 1,
    });
  });

  it("should handle empty headers", () => {
    const result = createGridColumns([]);
    expect(result).toEqual([]);
  });

  it("should handle single header", () => {
    const result = createGridColumns(["key"]);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("key");
  });
});


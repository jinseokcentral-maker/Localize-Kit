/**
 * Unit tests for project utilities
 */

import { describe, expect, it } from "vitest";
import { filterProjectLanguages } from "../projectUtils";

describe("filterProjectLanguages", () => {
  it("should return valid language strings from array", () => {
    const languages = ["en", "ko", "ja"];
    const result = filterProjectLanguages(languages);
    expect(result).toEqual(["en", "ko", "ja"]);
  });

  it("should filter out non-string values", () => {
    const languages = ["en", 123, "ko", null, "ja", undefined];
    const result = filterProjectLanguages(languages as unknown);
    expect(result).toEqual(["en", "ko", "ja"]);
  });

  it("should return empty array for non-array input", () => {
    const result = filterProjectLanguages("not an array");
    expect(result).toEqual([]);
  });

  it("should return empty array for null input", () => {
    const result = filterProjectLanguages(null);
    expect(result).toEqual([]);
  });

  it("should return empty array for undefined input", () => {
    const result = filterProjectLanguages(undefined);
    expect(result).toEqual([]);
  });

  it("should return empty array for empty array", () => {
    const result = filterProjectLanguages([]);
    expect(result).toEqual([]);
  });

  it("should handle array with only non-string values", () => {
    const languages = [123, null, undefined, true, {}];
    const result = filterProjectLanguages(languages as unknown);
    expect(result).toEqual([]);
  });

  it("should preserve empty strings", () => {
    const languages = ["en", "", "ko"];
    const result = filterProjectLanguages(languages);
    expect(result).toEqual(["en", "", "ko"]);
  });
});


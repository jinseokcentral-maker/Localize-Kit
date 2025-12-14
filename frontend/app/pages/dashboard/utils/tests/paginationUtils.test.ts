/**
 * Unit tests for pagination utilities
 */

import { describe, expect, it } from "vitest";
import { generatePageNumbers } from "../paginationUtils";

describe("generatePageNumbers", () => {
  it("should return all pages when total is 7 or less", () => {
    const result = generatePageNumbers(1, 5);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it("should return all pages when total is exactly 7", () => {
    const result = generatePageNumbers(4, 7);
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("should show ellipsis when current page is far from start", () => {
    const result = generatePageNumbers(5, 10);
    expect(result).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });

  it("should show ellipsis when current page is far from end", () => {
    const result = generatePageNumbers(2, 10);
    expect(result).toEqual([1, 2, 3, "ellipsis", 10]);
  });

  it("should show ellipsis on both sides when current page is in middle", () => {
    const result = generatePageNumbers(5, 10);
    expect(result).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });

  it("should not show ellipsis when current page is near start", () => {
    const result = generatePageNumbers(2, 10);
    expect(result).toEqual([1, 2, 3, "ellipsis", 10]);
  });

  it("should not show ellipsis when current page is near end", () => {
    const result = generatePageNumbers(9, 10);
    expect(result).toEqual([1, "ellipsis", 8, 9, 10]);
  });

  it("should handle single page", () => {
    const result = generatePageNumbers(1, 1);
    expect(result).toEqual([1]);
  });

  it("should always include first page", () => {
    const result = generatePageNumbers(10, 20);
    expect(result[0]).toBe(1);
  });

  it("should always include last page when total > 1", () => {
    const result = generatePageNumbers(5, 20);
    const lastPage = result[result.length - 1];
    expect(lastPage).toBe(20);
  });

  it("should show current page and adjacent pages", () => {
    const result = generatePageNumbers(5, 10);
    const currentIndex = result.indexOf(5);
    expect(currentIndex).toBeGreaterThan(-1);
    // Should have pages before and after current
    expect(result).toContain(4);
    expect(result).toContain(6);
  });

  it("should handle edge case: page 1 of large set", () => {
    const result = generatePageNumbers(1, 20);
    expect(result).toEqual([1, 2, 3, "ellipsis", 20]);
  });

  it("should handle edge case: last page of large set", () => {
    const result = generatePageNumbers(20, 20);
    expect(result).toEqual([1, "ellipsis", 19, 20]);
  });
});


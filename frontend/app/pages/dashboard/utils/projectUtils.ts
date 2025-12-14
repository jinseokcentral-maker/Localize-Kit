/**
 * Project utility functions
 */

/**
 * Filter and validate languages array from project data
 * Handles both string arrays and unknown types
 * @param languages - Languages array from project (can be string[] or unknown)
 * @returns Filtered array of valid language strings
 */
export function filterProjectLanguages(
  languages: string[] | unknown,
): string[] {
  return Array.isArray(languages)
    ? languages.filter((lang): lang is string => typeof lang === "string")
    : [];
}


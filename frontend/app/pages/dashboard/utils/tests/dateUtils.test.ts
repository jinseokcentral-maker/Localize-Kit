import { describe, it, expect, beforeEach, vi } from "vitest";
import dayjs from "dayjs";
import { formatRelativeDate } from "../dateUtils";

describe("dateUtils", () => {
  describe("formatRelativeDate", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("should return 'Recently' for invalid date", () => {
      expect(formatRelativeDate(null)).toBe("Recently");
      expect(formatRelativeDate(undefined)).toBe("Recently");
      expect(formatRelativeDate(123)).toBe("Recently");
      expect(formatRelativeDate("invalid-date")).toBe("Recently");
    });

    it("should return 'Just now' for very recent date", () => {
      const now = dayjs();
      const dateString = now.toISOString();
      vi.setSystemTime(now.toDate());
      expect(formatRelativeDate(dateString)).toBe("Just now");
    });

    it("should return minutes ago for dates less than an hour old", () => {
      const now = dayjs();
      const dateString = now.subtract(30, "minute").toISOString();
      vi.setSystemTime(now.toDate());
      expect(formatRelativeDate(dateString)).toBe("30 minutes ago");
    });

    it("should return hours ago for dates less than a day old", () => {
      const now = dayjs();
      const dateString = now.subtract(2, "hour").toISOString();
      vi.setSystemTime(now.toDate());
      expect(formatRelativeDate(dateString)).toBe("2 hours ago");
    });

    it("should return 'Yesterday' for dates one day ago", () => {
      const now = dayjs();
      const dateString = now.subtract(1, "day").toISOString();
      vi.setSystemTime(now.toDate());
      expect(formatRelativeDate(dateString)).toBe("Yesterday");
    });

    it("should return days ago for dates less than a week old", () => {
      const now = dayjs();
      const dateString = now.subtract(3, "day").toISOString();
      vi.setSystemTime(now.toDate());
      expect(formatRelativeDate(dateString)).toBe("3 days ago");
    });

    it("should return weeks ago for dates less than a month old", () => {
      const now = dayjs();
      const dateString = now.subtract(2, "week").toISOString();
      vi.setSystemTime(now.toDate());
      expect(formatRelativeDate(dateString)).toBe("2 weeks ago");
    });

    it("should return months ago for dates less than a year old", () => {
      const now = dayjs();
      const dateString = now.subtract(3, "month").toISOString();
      vi.setSystemTime(now.toDate());
      expect(formatRelativeDate(dateString)).toBe("3 months ago");
    });

    it("should return years ago for dates more than a year old", () => {
      const now = dayjs();
      const dateString = now.subtract(2, "year").toISOString();
      vi.setSystemTime(now.toDate());
      expect(formatRelativeDate(dateString)).toBe("2 years ago");
    });

    it("should handle singular vs plural correctly", () => {
      const now = dayjs();
      vi.setSystemTime(now.toDate());

      expect(formatRelativeDate(now.subtract(1, "minute").toISOString())).toBe(
        "1 minute ago",
      );
      expect(formatRelativeDate(now.subtract(1, "hour").toISOString())).toBe(
        "1 hour ago",
      );
      expect(formatRelativeDate(now.subtract(1, "week").toISOString())).toBe(
        "1 week ago",
      );
      expect(formatRelativeDate(now.subtract(1, "month").toISOString())).toBe(
        "1 month ago",
      );
      expect(formatRelativeDate(now.subtract(1, "year").toISOString())).toBe(
        "1 year ago",
      );
    });
  });
});


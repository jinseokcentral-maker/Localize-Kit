/**
 * Date formatting utilities using dayjs
 */
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

/**
 * Format date to relative time string
 * Returns human-readable relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeDate(
    dateString: string | unknown,
): string {
    if (!dateString || typeof dateString !== "string") {
        return "Recently";
    }

    try {
        const date = dayjs(dateString);
        if (!date.isValid()) {
            return "Recently";
        }

        const now = dayjs();
        const diffDays = now.diff(date, "day");

        if (diffDays === 0) {
            const diffHours = now.diff(date, "hour");
            if (diffHours === 0) {
                const diffMinutes = now.diff(date, "minute");
                if (diffMinutes === 0) {
                    return "Just now";
                }
                return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
            }
            return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        }

        if (diffDays === 1) {
            return "Yesterday";
        }

        if (diffDays < 7) {
            return `${diffDays} days ago`;
        }

        if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
        }

        if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} month${months > 1 ? "s" : ""} ago`;
        }

        const years = Math.floor(diffDays / 365);
        return `${years} year${years > 1 ? "s" : ""} ago`;
    } catch {
        return "Recently";
    }
}

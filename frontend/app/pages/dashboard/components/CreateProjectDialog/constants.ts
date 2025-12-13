/**
 * Language options for project creation
 * Based on most commonly used languages globally (top ~30 languages)
 * Data structure: { label: "Language Name", value: "iso_639_1", flag: "🇺🇸" }
 */
export const LANGUAGES = [
    // Top 10 most spoken languages by native speakers
    { label: "English", value: "en", flag: "🇺🇸" },
    { label: "Chinese (Simplified)", value: "zh-CN", flag: "🇨🇳" },
    { label: "Spanish", value: "es", flag: "🇪🇸" },
    { label: "Hindi", value: "hi", flag: "🇮🇳" },
    { label: "Arabic", value: "ar", flag: "🇸🇦" },
    { label: "Portuguese", value: "pt", flag: "🇧🇷" },
    { label: "Bengali", value: "bn", flag: "🇧🇩" },
    { label: "Russian", value: "ru", flag: "🇷🇺" },
    { label: "Japanese", value: "ja", flag: "🇯🇵" },
    { label: "German", value: "de", flag: "🇩🇪" },

    // Next tier - commonly used in tech/localization
    { label: "French", value: "fr", flag: "🇫🇷" },
    { label: "Urdu", value: "ur", flag: "🇵🇰" },
    { label: "Indonesian", value: "id", flag: "🇮🇩" },
    { label: "Italian", value: "it", flag: "🇮🇹" },
    { label: "Turkish", value: "tr", flag: "🇹🇷" },
    { label: "Korean", value: "ko", flag: "🇰🇷" },
    { label: "Vietnamese", value: "vi", flag: "🇻🇳" },
    { label: "Polish", value: "pl", flag: "🇵🇱" },
    { label: "Ukrainian", value: "uk", flag: "🇺🇦" },
    { label: "Dutch", value: "nl", flag: "🇳🇱" },

    // Additional popular languages
    { label: "Thai", value: "th", flag: "🇹🇭" },
    { label: "Czech", value: "cs", flag: "🇨🇿" },
    { label: "Romanian", value: "ro", flag: "🇷🇴" },
    { label: "Greek", value: "el", flag: "🇬🇷" },
    { label: "Hungarian", value: "hu", flag: "🇭🇺" },
    { label: "Swedish", value: "sv", flag: "🇸🇪" },
    { label: "Norwegian", value: "no", flag: "🇳🇴" },
    { label: "Danish", value: "da", flag: "🇩🇰" },
    { label: "Finnish", value: "fi", flag: "🇫🇮" },
    { label: "Hebrew", value: "he", flag: "🇮🇱" },
] as const;

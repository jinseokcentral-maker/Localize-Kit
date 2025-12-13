/**
 * Effect-based async operations for editor
 */
import { Effect } from "effect";
import {
    excelToCsv,
    parseCsvString,
    rewriteCsvKeySeparator,
} from "~/lib/parser/index";
import { logTimed } from "~/lib/logger";
import JSZip from "jszip";
import type { Separator } from "./editorUtils";

export interface ParseOptions {
    separator: Separator;
    nested: boolean;
}

export interface ParseResult {
    data: Record<string, Record<string, unknown>>;
    languages: string[];
    row_count?: number;
}

/**
 * Parse CSV string using Effect
 */
export function parseCsvEffect(
    csv: string,
    options: ParseOptions,
): Effect.Effect<ParseResult, Error> {
    return Effect.gen(function* (_) {
        const start = performance.now();

        const result = yield* _(
            Effect.tryPromise({
                try: () =>
                    parseCsvString(csv, {
                        separator: options.separator,
                        nested: options.nested,
                    }),
                catch: (err) =>
                    new Error(
                        err instanceof Error
                            ? err.message
                            : "Failed to parse CSV",
                    ),
            }),
        );

        const end = performance.now();
        logTimed("Parse CSV", end - start);

        return {
            data: result.data ?? {},
            languages: result.languages || [],
            row_count: result.row_count,
        };
    });
}

/**
 * Rewrite CSV key separator using Effect
 */
export function rewriteCsvSeparatorEffect(
    csv: string,
    separator: Separator,
): Effect.Effect<string, Error> {
    return Effect.try({
        try: () => rewriteCsvKeySeparator(csv, separator),
        catch: (err) =>
            new Error(
                err instanceof Error ? err.message : "Failed to rewrite CSV",
            ),
    });
}

/**
 * Convert Excel file to CSV using Effect
 */
export function excelToCsvEffect(
    buffer: Uint8Array,
): Effect.Effect<string, Error> {
    return Effect.tryPromise({
        try: () => excelToCsv(buffer),
        catch: (err) =>
            new Error(
                err instanceof Error
                    ? err.message
                    : "Failed to convert Excel to CSV",
            ),
    });
}

/**
 * Read file as ArrayBuffer using Effect
 */
export function readFileAsArrayBufferEffect(
    file: File,
): Effect.Effect<ArrayBuffer, Error> {
    return Effect.tryPromise({
        try: () => {
            return new Promise<ArrayBuffer>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result;
                    if (result instanceof ArrayBuffer) {
                        resolve(result);
                    } else {
                        reject(new Error("Failed to read file as ArrayBuffer"));
                    }
                };
                reader.onerror = () => {
                    reject(new Error("FileReader error"));
                };
                reader.readAsArrayBuffer(file);
            });
        },
        catch: (err) =>
            new Error(
                err instanceof Error ? err.message : "Failed to read file",
            ),
    });
}

/**
 * Read file as text using Effect
 */
export function readFileAsTextEffect(
    file: File,
): Effect.Effect<string, Error> {
    return Effect.tryPromise({
        try: () => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result;
                    if (typeof result === "string") {
                        resolve(result);
                    } else {
                        reject(new Error("Failed to read file as text"));
                    }
                };
                reader.onerror = () => {
                    reject(new Error("FileReader error"));
                };
                reader.readAsText(file);
            });
        },
        catch: (err) =>
            new Error(
                err instanceof Error ? err.message : "Failed to read file",
            ),
    });
}

/**
 * Generate ZIP file from JSON output using Effect
 */
export function generateZipEffect(
    jsonOutput: Record<string, Record<string, unknown>>,
): Effect.Effect<Blob, Error> {
    return Effect.gen(function* (_) {
        const zip = new JSZip();

        Object.entries(jsonOutput).forEach(([lang, data]) => {
            const jsonString = JSON.stringify(data, null, 2);
            zip.file(`${lang.toLowerCase()}.json`, jsonString);
        });

        const content = yield* _(
            Effect.tryPromise({
                try: () => zip.generateAsync({ type: "blob" }),
                catch: (err) =>
                    new Error(
                        err instanceof Error
                            ? err.message
                            : "Failed to generate ZIP file",
                    ),
            }),
        );

        return content;
    });
}


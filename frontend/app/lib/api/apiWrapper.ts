/**
 * API wrapper utilities
 * Extracts data from ResponseEnvelopeDto automatically
 */

import type { ResponseEnvelopeDto } from "~/api/types.gen";

/**
 * Extract data from ResponseEnvelopeDto
 * Handles the response.data.data pattern
 */
export function extractApiData<T>(
    response: ResponseEnvelopeDto & { data?: T },
): T {
    if (!response.data) {
        throw new Error("API response does not contain data");
    }
    return response.data;
}

/**
 * Wrap error while preserving original error object
 * This ensures original API error messages can be extracted later
 * @param err - The error from API (can be Error instance or plain object)
 * @param defaultMessage - Default message if error has no message
 * @returns Error instance with originalError property attached
 */
export function preserveError(
    err: unknown,
    defaultMessage: string = "An error occurred",
): Error {
    // If it's already an Error instance, attach original if needed
    if (err instanceof Error) {
        // Only attach originalError if it doesn't have one already
        if (!("originalError" in err)) {
            (err as unknown as { originalError?: unknown }).originalError = err;
        }
        return err;
    }
    // If it's an object with message, create Error and preserve original
    if (err && typeof err === "object") {
        const errorMessage = "message" in err && typeof err.message === "string"
            ? err.message
            : defaultMessage;
        const error = new Error(errorMessage);
        // Attach original error object for getErrorMessage to access
        (error as unknown as { originalError?: unknown }).originalError = err;
        return error;
    }
    // Fallback to default error
    return new Error(defaultMessage);
}

/**
 * Extract error message from API error
 * Tries multiple fields to find the error message
 * @param error - The error object from API or Error instance
 * @param defaultMessage - Default message to use if no error message found. Defaults to "Something went wrong. Please try again."
 * @returns Error message string
 */
export function getErrorMessage(
    error: unknown,
    defaultMessage: string = "Something went wrong. Please try again.",
): string {
    // First check if error has originalError property (from Effect catch wrapper)
    if (
        error &&
        typeof error === "object" &&
        "originalError" in error &&
        error.originalError
    ) {
        const original = error.originalError;
        if (original && typeof original === "object") {
            if ("message" in original && typeof original.message === "string") {
                return original.message;
            }
            if ("error" in original && typeof original.error === "string") {
                return original.error;
            }
        }
    }

    // Check error object directly
    if (error && typeof error === "object") {
        // Try to extract message from error object
        if ("message" in error && typeof error.message === "string") {
            return error.message;
        }
        // Try to extract error field
        if ("error" in error && typeof error.error === "string") {
            return error.error;
        }
    }
    // Check Error instance
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return defaultMessage;
}

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
 * Wrapper for API functions that return ResponseEnvelopeDto
 * Automatically extracts data.data pattern
 */
export async function callApi<T>(
    apiFn: () => Promise<{ data: ResponseEnvelopeDto & { data?: T } }>,
): Promise<T> {
    const response = await apiFn();
    return extractApiData(response.data);
}

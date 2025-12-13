import * as z from "zod";

/**
 * Zod schema for project creation form
 */
export const createProjectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    slug: z
        .string()
        .min(1, "Slug is required")
        .regex(
            /^[a-z0-9-]+$/,
            "Slug must contain only lowercase English letters (a-z), numbers (0-9), and hyphens (-). Korean, Chinese, Japanese, and other non-English characters are not allowed.",
        ),
    defaultLanguage: z.string().min(1, "Please select a default language"),
    languages: z.array(z.string()).min(1, "Select at least one language"),
});

/**
 * TypeScript type inferred from the schema
 */
export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

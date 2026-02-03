/**
 * Safe JSON Parsing Utilities for AI Responses
 * 
 * Handles common AI response formatting issues:
 * - Markdown code fences (```json ... ```)
 * - Extra whitespace and commentary
 * - Malformed JSON with graceful degradation
 */

import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export interface SafeParseResult<T> {
    success: true;
    data: T;
}

export interface SafeParseError {
    success: false;
    error: string;
    rawContent?: string;
}

export type SafeParseResponse<T> = SafeParseResult<T> | SafeParseError;

// ============================================================================
// Core Parsing Functions
// ============================================================================

/**
 * Extract JSON from AI response that may contain markdown code fences
 * Handles common patterns:
 * - ```json { ... } ```
 * - ``` { ... } ```
 * - Pure JSON
 * - JSON with leading/trailing text
 */
export function extractJsonFromAIResponse(rawContent: string): string {
    if (!rawContent || typeof rawContent !== 'string') {
        return '';
    }

    let content = rawContent.trim();

    // Pattern 1: Remove markdown code fences with language tag
    // Matches: ```json ... ``` or ```JSON ... ```
    const jsonFencePattern = /```json\s*([\s\S]*?)```/i;
    const jsonMatch = content.match(jsonFencePattern);
    if (jsonMatch && jsonMatch[1]) {
        return jsonMatch[1].trim();
    }

    // Pattern 2: Remove generic markdown code fences
    // Matches: ``` ... ```
    const genericFencePattern = /```\s*([\s\S]*?)```/;
    const genericMatch = content.match(genericFencePattern);
    if (genericMatch && genericMatch[1]) {
        return genericMatch[1].trim();
    }

    // Pattern 3: Try to extract JSON object or array
    // Find first { or [ and last } or ]
    const objectStart = content.indexOf('{');
    const arrayStart = content.indexOf('[');

    let startIndex = -1;
    let endChar = '';

    if (objectStart !== -1 && (arrayStart === -1 || objectStart < arrayStart)) {
        startIndex = objectStart;
        endChar = '}';
    } else if (arrayStart !== -1) {
        startIndex = arrayStart;
        endChar = ']';
    }

    if (startIndex !== -1) {
        // Find the matching closing bracket
        let depth = 0;
        let endIndex = -1;
        const startChar = content[startIndex];

        for (let i = startIndex; i < content.length; i++) {
            if (content[i] === startChar) depth++;
            if (content[i] === endChar) depth--;
            if (depth === 0) {
                endIndex = i;
                break;
            }
        }

        if (endIndex !== -1) {
            return content.slice(startIndex, endIndex + 1);
        }
    }

    // Pattern 4: Return as-is (might be pure JSON)
    return content;
}

/**
 * Safely parse JSON with error handling
 * Returns null if parsing fails
 */
export function safeJsonParse<T = unknown>(content: string): T | null {
    try {
        const extracted = extractJsonFromAIResponse(content);
        if (!extracted) return null;
        return JSON.parse(extracted) as T;
    } catch {
        return null;
    }
}

/**
 * Parse AI response with Zod schema validation
 * Provides type-safe parsing with detailed error messages
 */
export function parseAIResponseWithSchema<T>(
    rawContent: string,
    schema: z.ZodType<T>
): SafeParseResponse<T> {
    // Step 1: Extract JSON from potential markdown
    const extracted = extractJsonFromAIResponse(rawContent);

    if (!extracted) {
        return {
            success: false,
            error: 'No JSON content found in response',
            rawContent,
        };
    }

    // Step 2: Parse JSON
    let parsed: unknown;
    try {
        parsed = JSON.parse(extracted);
    } catch (parseError) {
        return {
            success: false,
            error: `JSON parse error: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
            rawContent,
        };
    }

    // Step 3: Validate with Zod schema
    const result = schema.safeParse(parsed);

    if (!result.success) {
        const issues = result.error.issues
            .map(issue => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ');
        return {
            success: false,
            error: `Validation error: ${issues}`,
            rawContent,
        };
    }

    return {
        success: true,
        data: result.data,
    };
}

// ============================================================================
// Pre-defined Schemas for Common AI Responses
// ============================================================================

/**
 * Schema for food comparison verdict
 */
export const ComparisonVerdictSchema = z.object({
    verdict: z.object({
        summary: z.string().min(1, 'Summary is required'),
        winner: z.enum(['A', 'B', 'tie', 'a', 'b', 'Tie', 'TIE']).transform(v => v.toLowerCase() as 'a' | 'b' | 'tie'),
        keyDifferences: z.array(z.string()).default([]),
        recommendations: z.array(z.string()).default([]),
        context: z.string().optional().default('general-health'),
    }),
});

export type ComparisonVerdictResponse = z.infer<typeof ComparisonVerdictSchema>;

/**
 * Schema for nutrition analysis
 */
export const NutritionAnalysisSchema = z.object({
    foodName: z.string().min(1),
    calories: z.number().nonnegative(),
    protein_g: z.number().nonnegative(),
    carbs_g: z.number().nonnegative(),
    fat_g: z.number().nonnegative(),
    servingSize: z.string().optional().default('1 serving'),
});

export type NutritionAnalysisResponse = z.infer<typeof NutritionAnalysisSchema>;

/**
 * Schema for weekly insights
 */
export const WeeklyInsightsSchema = z.object({
    insights: z.array(z.object({
        id: z.string().optional(),
        category: z.enum(['nutrition', 'habits', 'progress', 'tips']).default('tips'),
        title: z.string(),
        description: z.string(),
        severity: z.enum(['info', 'warning', 'success', 'error']).default('info'),
        actionable: z.boolean().default(false),
        action: z.string().optional(),
    })),
    weeklyStats: z.object({
        avgCalories: z.number().optional(),
        avgProtein: z.number().optional(),
        consistencyScore: z.number().optional(),
        topFoods: z.array(z.string()).optional(),
    }).optional(),
});

export type WeeklyInsightsResponse = z.infer<typeof WeeklyInsightsSchema>;

// ============================================================================
// User-friendly Error Messages
// ============================================================================

/**
 * Convert technical errors to user-friendly messages
 */
export function getUserFriendlyError(error: string): string {
    if (error.includes('JSON parse error')) {
        return "We couldn't read the AI response. Please try again.";
    }
    if (error.includes('Validation error')) {
        return "The AI response was incomplete. Please try again.";
    }
    if (error.includes('No JSON content')) {
        return "No data received from AI. Please try again.";
    }
    return error;
}

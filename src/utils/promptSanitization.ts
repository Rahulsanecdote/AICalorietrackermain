/**
 * Prompt Injection Protection
 * Sanitizes user inputs to prevent prompt injection attacks
 */

const MAX_INPUT_LENGTH = 500
const SUSPICIOUS_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/gi,
  /forget\s+(all\s+)?(previous|above)/gi,
  /system\s*:/gi,
  /assistant\s*:/gi,
  /\[system\]/gi,
  /\[\/system\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /new\s+instructions?/gi,
  /disregard/gi,
]

export interface SanitizationResult {
  sanitized: string
  isValid: boolean
  warnings: string[]
  originalLength: number
  sanitizedLength: number
}

/**
 * Sanitize user input for AI prompts
 */
export function sanitizePromptInput(input: string): SanitizationResult {
  const warnings: string[] = []
  let sanitized = input.trim()
  const originalLength = sanitized.length

  // Check length
  if (sanitized.length === 0) {
    return {
      sanitized: "",
      isValid: false,
      warnings: ["Input is empty"],
      originalLength: 0,
      sanitizedLength: 0,
    }
  }

  if (sanitized.length > MAX_INPUT_LENGTH) {
    warnings.push(`Input truncated from ${sanitized.length} to ${MAX_INPUT_LENGTH} characters`)
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH)
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      warnings.push("Potential prompt injection detected and removed")
      sanitized = sanitized.replace(pattern, "")
    }
  }

  // Remove excessive punctuation (potential injection)
  const originalPunctuation = sanitized
  sanitized = sanitized.replace(/[!?]{3,}/g, "!!")
  if (sanitized !== originalPunctuation) {
    warnings.push("Excessive punctuation removed")
  }

  // Remove control characters (using explicit character class to avoid eslint no-control-regex)
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, "")

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim()

  // Final validation
  const isValid = sanitized.length > 0 && sanitized.length <= MAX_INPUT_LENGTH

  return {
    sanitized,
    isValid,
    warnings,
    originalLength,
    sanitizedLength: sanitized.length,
  }
}

/**
 * Create a safe prompt template
 */
export function createSafePrompt(
  userInput: string,
  template: "nutrition" | "recipe" | "meal-plan",
): { prompt: string; metadata: SanitizationResult } {
  const sanitized = sanitizePromptInput(userInput)

  if (!sanitized.isValid) {
    throw new Error(`Invalid input: ${sanitized.warnings.join(", ")}`)
  }

  const templates = {
    nutrition: `Analyze the following food description and provide nutritional information. Only respond with valid JSON containing foodName, calories, protein_g, carbs_g, fat_g, and servingSize.\n\nFood: "${sanitized.sanitized}"`,
    recipe: `Provide recipe details for: "${sanitized.sanitized}"`,
    "meal-plan": `Generate a meal plan based on: "${sanitized.sanitized}"`,
  }

  return {
    prompt: templates[template],
    metadata: sanitized,
  }
}

import { describe, it, expect } from 'vitest'
import { sanitizePromptInput } from '../utils/promptSanitization'

describe('sanitizePromptInput', () => {
    it('should return invalid for empty input', () => {
        const result = sanitizePromptInput('')
        expect(result.isValid).toBe(false)
        expect(result.warnings).toContain('Input is empty')
    })

    it('should sanitize valid input', () => {
        const result = sanitizePromptInput('chicken breast 100g')
        expect(result.isValid).toBe(true)
        expect(result.sanitized).toBe('chicken breast 100g')
    })

    it('should truncate long input', () => {
        const longInput = 'a'.repeat(600)
        const result = sanitizePromptInput(longInput)
        expect(result.sanitizedLength).toBeLessThanOrEqual(500)
        expect(result.warnings.some(w => w.includes('truncated'))).toBe(true)
    })

    it('should remove excessive punctuation', () => {
        const result = sanitizePromptInput('hello!!!!!')
        expect(result.sanitized).toBe('hello!!')
    })

    it('should normalize whitespace', () => {
        const result = sanitizePromptInput('hello    world')
        expect(result.sanitized).toBe('hello world')
    })
})

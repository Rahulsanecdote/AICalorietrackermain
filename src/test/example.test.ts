import { describe, it, expect } from 'vitest'

// Simple utility function tests
describe('Basic Math Operations', () => {
    it('should add numbers correctly', () => {
        expect(1 + 1).toBe(2)
    })

    it('should multiply numbers correctly', () => {
        expect(2 * 3).toBe(6)
    })
})

// Array operations
describe('Array Operations', () => {
    it('should filter an array', () => {
        const numbers = [1, 2, 3, 4, 5]
        const evens = numbers.filter(n => n % 2 === 0)
        expect(evens).toEqual([2, 4])
    })

    it('should map an array', () => {
        const numbers = [1, 2, 3]
        const doubled = numbers.map(n => n * 2)
        expect(doubled).toEqual([2, 4, 6])
    })
})

// String operations
describe('String Operations', () => {
    it('should concatenate strings', () => {
        expect('Hello' + ' ' + 'World').toBe('Hello World')
    })

    it('should convert to uppercase', () => {
        expect('hello'.toUpperCase()).toBe('HELLO')
    })
})

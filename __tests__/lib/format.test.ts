import { describe, it, expect } from 'vitest'
import {
    getUniversityName,
    formatUserAlias,
    formatMessageTime,
    formatCurrency,
} from '@/lib/format'

describe('format utilities', () => {
    describe('getUniversityName', () => {
        it('returns "Universidade da Coruña" for udc.es', () => {
            expect(getUniversityName('udc.es')).toBe('Universidade da Coruña')
        })

        it('returns "Universidade da Coruña" for udc.gal', () => {
            expect(getUniversityName('udc.gal')).toBe('Universidade da Coruña')
        })

        it('returns the domain itself for unknown domains', () => {
            expect(getUniversityName('unknown.edu')).toBe('unknown.edu')
        })
    })

    describe('formatUserAlias', () => {
        it('returns "Usuario" for null', () => {
            expect(formatUserAlias(null)).toBe('Usuario')
        })

        it('returns "Usuario" for undefined', () => {
            expect(formatUserAlias(undefined)).toBe('Usuario')
        })

        it('returns "Usuario" for empty string', () => {
            expect(formatUserAlias('')).toBe('Usuario')
        })

        it('removes domain from alias', () => {
            expect(formatUserAlias('john.doe@udc.es')).toBe('john.doe')
        })

        it('returns alias as-is if no @ symbol', () => {
            expect(formatUserAlias('johndoe')).toBe('johndoe')
        })
    })

    describe('formatMessageTime', () => {
        it('formats time correctly', () => {
            const date = new Date('2024-03-15T14:30:00')
            const result = formatMessageTime(date)
            expect(result).toMatch(/\d{2}:\d{2}/)
        })

        it('accepts string dates', () => {
            const result = formatMessageTime('2024-03-15T14:30:00')
            expect(result).toMatch(/\d{2}:\d{2}/)
        })
    })

    describe('formatCurrency', () => {
        it('formats positive amounts correctly', () => {
            const result = formatCurrency(19.99)
            expect(result).toContain('19,99')
            expect(result).toContain('€')
        })

        it('formats zero', () => {
            const result = formatCurrency(0)
            expect(result).toContain('0')
            expect(result).toContain('€')
        })

        it('formats large amounts', () => {
            const result = formatCurrency(1234.56)
            expect(result).toContain('€')
        })
    })
})

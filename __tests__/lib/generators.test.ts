import { describe, it, expect } from 'vitest'
import {
    generateAnonymousAliases,
    generateInstitutionalAlias,
} from '@/lib/generators'

describe('generators utilities', () => {
    describe('generateAnonymousAliases', () => {
        it('generates the requested number of aliases', () => {
            const aliases = generateAnonymousAliases(5)
            expect(aliases).toHaveLength(5)
        })

        it('generates unique aliases', () => {
            const aliases = generateAnonymousAliases(10)
            const uniqueAliases = new Set(aliases)
            expect(uniqueAliases.size).toBe(10)
        })

        it('generates default of 5 aliases when no count provided', () => {
            const aliases = generateAnonymousAliases()
            expect(aliases).toHaveLength(5)
        })

        it('each alias contains a noun and adjective', () => {
            const aliases = generateAnonymousAliases(3)
            aliases.forEach(alias => {
                expect(alias).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d+$/)
            })
        })
    })

    describe('generateInstitutionalAlias', () => {
        it('generates alias from email', () => {
            expect(generateInstitutionalAlias('john.doe@udc.es')).toBe('john.doe@udc')
        })

        it('handles complex local parts', () => {
            expect(generateInstitutionalAlias('name.surname.123@udc.gal')).toBe('name.surname.123@udc')
        })

        it('returns empty string for empty email', () => {
            expect(generateInstitutionalAlias('')).toBe('')
        })

        it('returns empty string for email without @', () => {
            expect(generateInstitutionalAlias('invalid-email')).toBe('')
        })
    })
})

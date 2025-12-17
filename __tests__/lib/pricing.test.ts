import { describe, it, expect } from 'vitest'
import {
    PricingConstants,
    calculateTotalWithFees,
    calculatePlatformFee,
} from '@/lib/pricing'

describe('pricing utilities', () => {
    describe('PricingConstants', () => {
        it('has correct platform fee percentage', () => {
            expect(PricingConstants.PLATFORM_FEE_PERCENT).toBe(0.035)
        })

        it('has correct Stripe fee percentage', () => {
            expect(PricingConstants.STRIPE_FEE_PERCENT).toBe(0.014)
        })

        it('has correct Stripe fixed fee', () => {
            expect(PricingConstants.STRIPE_FIXED_FEE_CENTS).toBe(25)
        })
    })

    describe('calculateTotalWithFees', () => {
        it('returns 0 for zero price', () => {
            expect(calculateTotalWithFees(0)).toBe(0)
        })

        it('returns 0 for negative price', () => {
            expect(calculateTotalWithFees(-100)).toBe(0)
        })

        it('calculates total correctly for 1000 cents (10€)', () => {
            const total = calculateTotalWithFees(1000)
            // Base: 1000, Platform fee (3.5%): 35
            // With Stripe: (1035 + 25) / (1 - 0.014) = 1060 / 0.986 ≈ 1075
            expect(total).toBeGreaterThan(1000)
            expect(total).toBeLessThan(1100)
        })

        it('calculates total correctly for 5000 cents (50€)', () => {
            const total = calculateTotalWithFees(5000)
            // Should be roughly 5000 * 1.035 + stripe fees
            expect(total).toBeGreaterThan(5000)
            expect(total).toBeLessThan(5500)
        })

        it('always returns integer (rounded up)', () => {
            const total = calculateTotalWithFees(999)
            expect(Number.isInteger(total)).toBe(true)
        })
    })

    describe('calculatePlatformFee', () => {
        it('calculates 3.5% platform fee correctly', () => {
            expect(calculatePlatformFee(1000)).toBe(35) // 3.5% of 1000
        })

        it('calculates fee for larger amounts', () => {
            expect(calculatePlatformFee(10000)).toBe(350) // 3.5% of 10000
        })

        it('rounds to nearest integer', () => {
            const fee = calculatePlatformFee(999)
            expect(Number.isInteger(fee)).toBe(true)
        })

        it('handles small amounts', () => {
            expect(calculatePlatformFee(100)).toBe(4) // 3.5% of 100 = 3.5, rounds to 4
        })
    })

    describe('pricing formula integrity', () => {
        it('seller receives their asking price after all fees', () => {
            const sellerPrice = 1000 // 10€
            const total = calculateTotalWithFees(sellerPrice)
            const platformFee = calculatePlatformFee(sellerPrice)

            // Stripe takes: total * 1.4% + 25 cents
            const stripeFee = Math.round(total * PricingConstants.STRIPE_FEE_PERCENT) + PricingConstants.STRIPE_FIXED_FEE_CENTS

            // What's left after Stripe and platform fees should be ≥ seller price
            const remaining = total - stripeFee - platformFee
            expect(remaining).toBeGreaterThanOrEqual(sellerPrice - 1) // Allow 1 cent rounding error
        })
    })
})

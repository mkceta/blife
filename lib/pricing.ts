export const PricingConstants = {
    PLATFORM_FEE_PERCENT: 0.035, // 3.5%
    STRIPE_FEE_PERCENT: 0.014, // 1.4% (European cards standard)
    STRIPE_FIXED_FEE_CENTS: 25, // 0.25€
}

/**
 * Calculates the total price the buyer pays to ensure the seller gets their asking price
 * and the platform gets its commission, covering Stripe fees.
 * 
 * Formula derivation:
 * Total = SellerPrice + PlatformFee + StripeFee
 * PlatformFee = SellerPrice * 0.035
 * StripeFee = Total * 0.014 + 0.25
 * 
 * Total = SellerPrice + (SellerPrice * 0.035) + (Total * 0.014 + 0.25)
 * Total - (Total * 0.014) = SellerPrice * 1.035 + 0.25
 * Total * (1 - 0.014) = SellerPrice * 1.035 + 0.25
 * Total = (SellerPrice * 1.035 + 0.25) / (1 - 0.014)
 * 
 * @param priceCents The base price set by the seller in cents
 * @returns The total price in cents that the buyer should pay
 */
export function calculateTotalWithFees(priceCents: number): number {
    if (priceCents <= 0) return 0

    const baseWithPlatformFee = priceCents * (1 + PricingConstants.PLATFORM_FEE_PERCENT)
    const numerator = baseWithPlatformFee + PricingConstants.STRIPE_FIXED_FEE_CENTS
    const denominator = 1 - PricingConstants.STRIPE_FEE_PERCENT

    return Math.ceil(numerator / denominator)
}

/**
 * Calculates the platform commission (Buyer Protection) from the base price.
 * @param priceCents The base price set by the seller in cents
 * @returns The platform fee in cents
 */
export function calculatePlatformFee(priceCents: number): number {
    return Math.round(priceCents * PricingConstants.PLATFORM_FEE_PERCENT)
}

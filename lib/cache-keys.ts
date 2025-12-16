/**
 * Centralized Cache Key Factory
 * 
 * This file defines all React Query cache keys used throughout the application.
 * Benefits:
 * - Type-safe cache key generation
 * - Consistent cache naming
 * - Easy refactoring and debugging
 * - Prevents cache key typos
 * 
 * Usage:
 * ```ts
 * import { CACHE_KEYS } from '@/lib/cache-keys'
 * 
 * useQuery({
 *   queryKey: CACHE_KEYS.market.listings({ category: 'electronics' }),
 *   ...
 * })
 * ```
 */

import type { QueryClient } from '@tanstack/react-query'
import type { MarketFilters } from '@/lib/types'

// Re-export MarketFilters for backwards compatibility
export type { MarketFilters }

// Additional filter types specific to cache-keys
export interface CommunityFilters {
    category?: string
    q?: string
}

export interface FlatsFilters {
    location?: string
    minPrice?: number
    maxPrice?: number
    minRooms?: number
}

/**
 * Cache key factory functions
 * Each key is a const array to ensure type safety
 */
export const CACHE_KEYS = {
    // Market-related queries
    market: {
        all: ['market'] as const,
        listings: (filters?: MarketFilters) =>
            ['market', 'listings', filters] as const,
        listing: (id: string) =>
            ['market', 'listing', id] as const,
        favorites: (userId: string) =>
            ['market', 'favorites', userId] as const,
        averageLikes: () =>
            ['market', 'average-likes'] as const,
    },

    // Community-related queries
    community: {
        all: ['community'] as const,
        posts: (category: string, search?: string) =>
            ['community', 'posts', category, search] as const,
        post: (id: string) =>
            ['community', 'post', id] as const,
        reactions: (userId: string) =>
            ['community', 'reactions', userId] as const,
        polls: (category: string) =>
            ['community', 'polls', category] as const,
        poll: (id: string) =>
            ['community', 'poll', id] as const,
    },

    // Flats-related queries
    flats: {
        all: ['flats'] as const,
        listings: (filters?: FlatsFilters) =>
            ['flats', 'listings', filters] as const,
        listing: (id: string) =>
            ['flats', 'listing', id] as const,
    },

    // Messages-related queries
    messages: {
        all: ['messages'] as const,
        threads: (userId: string) =>
            ['messages', 'threads', userId] as const,
        thread: (threadId: string) =>
            ['messages', 'thread', threadId] as const,
        threadMessages: (threadId: string) =>
            ['messages', 'thread', threadId, 'messages'] as const,
        unreadCount: (userId: string) =>
            ['messages', 'unread-count', userId] as const,
    },

    // User & Profile queries
    user: {
        current: () =>
            ['current-user'] as const,
        profile: (userId: string) =>
            ['user', 'profile', userId] as const,
        listings: (userId: string) =>
            ['user', 'listings', userId] as const,
        badges: (userId: string) =>
            ['user', 'badges', userId] as const,
    },

    // Notifications
    notifications: {
        all: (userId: string) =>
            ['notifications', userId] as const,
        unreadCount: (userId: string) =>
            ['notifications', 'unread', userId] as const,
    },

    // Admin queries
    admin: {
        stats: () =>
            ['admin', 'stats'] as const,
        users: () =>
            ['admin', 'users'] as const,
        reports: () =>
            ['admin', 'reports'] as const,
    },
} as const

/**
 * Helper functions for common cache invalidation patterns
 */

export const invalidateMarket = (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.market.all })
}

export const invalidateCommunity = (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.community.all })
}

export const invalidateFlats = (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.flats.all })
}

export const invalidateMessages = (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.messages.threads(userId) })
}

export const invalidateNotifications = (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.notifications.all(userId) })
}

/**
 * More specific invalidation helpers
 */

export const invalidateSpecificListing = (queryClient: QueryClient, listingId: string) => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.market.listing(listingId) })
    // Also invalidate the listings list that contains this item
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.market.all })
}

export const invalidateSpecificPost = (queryClient: QueryClient, postId: string) => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.community.post(postId) })
    // Also invalidate the posts list
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.community.all })
}

export const invalidateUserFavorites = (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.market.favorites(userId) })
}

export const invalidateUserReactions = (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.community.reactions(userId) })
}

/**
 * Supabase RPC Function Type Extensions
 * 
 * This file defines TypeScript types for custom RPC functions in the database.
 * These extend the auto-generated Supabase types to provide type safety for
 * custom PostgreSQL functions.
 * 
 * Usage:
 * ```ts
 * import { TypedSupabaseClient } from '@/lib/supabase/rpc-types'
 * 
 * const supabase = createClient() as TypedSupabaseClient
 * await supabase.rpc('increment_favorites', { listing_id: '...' })
 * ```
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * RPC function signatures for the database
 */
export interface RPCFunctions {
    // Favorites management
    increment_favorites: {
        Args: { listing_id: string }
        Returns: void
    }
    decrement_favorites: {
        Args: { listing_id: string }
        Returns: void
    }

    // Reactions (likes) management
    increment_reactions: {
        Args: { post_id: string }
        Returns: void
    }
    decrement_reactions: {
        Args: { post_id: string }
        Returns: void
    }

    // View tracking
    increment_listing_views: {
        Args: { listing_id: string }
        Returns: void
    }

    // Presence management
    update_presence: {
        Args: Record<string, never> // No arguments
        Returns: void
    }

    // Badge system
    check_and_award_badges: {
        Args: { target_user_id: string }
        Returns: void
    }

    // Sale completion
    complete_sale: {
        Args: {
            p_listing_id: string
            p_buyer_id: string
        }
        Returns: {
            success: boolean
            message?: string
        }
    }
}

/**
 * Type helper for calling RPC functions with proper types
 * 
 * This creates a properly typed rpc method that knows about our custom functions
 */
export type TypedRpcCall = <T extends keyof RPCFunctions>(
    fn: T,
    args: RPCFunctions[T]['Args']
) => Promise<{ data: RPCFunctions[T]['Returns'] | null; error: Error | null }>

/**
 * Extended Supabase client type with typed RPC calls
 */
export type TypedSupabaseClient = SupabaseClient & {
    rpc: TypedRpcCall
}

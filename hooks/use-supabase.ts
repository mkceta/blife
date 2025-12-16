'use client'

import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Custom hook that returns a memoized Supabase client.
 * 
 * This prevents creating a new client instance on every render,
 * which improves performance by reducing object allocations and
 * preventing unnecessary re-renders in child components.
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const supabase = useSupabase()
 *   // Use supabase...
 * }
 * ```
 */
export function useSupabase() {
    return useMemo(() => createClient(), [])
}

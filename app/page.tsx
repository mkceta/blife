import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Root page - handles automatic routing based on authentication status
 * 
 * Server Component that performs instant server-side redirect:
 * - Authenticated users → /market
 * - Unauthenticated users → /landing
 * 
 * @performance No loading spinner shown to user - instant redirect
 */
export default async function RootPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    // User is authenticated, redirect to market
    redirect('/market')
  } else {
    // User is not authenticated, redirect to landing
    redirect('/landing')
  }
}


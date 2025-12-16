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
  try {
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      redirect('/market')
    }
  } catch (error) {
    console.error('RootPage Error:', error)
    // Fallback to landing if anything fails
  }

  redirect('/landing')
}


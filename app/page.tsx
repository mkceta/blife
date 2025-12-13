'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function RootPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // User is authenticated, redirect to market
        router.replace('/market')
      } else {
        // User is not authenticated, redirect to landing
        router.replace('/landing')
      }
    }

    checkAuthAndRedirect()
  }, [router, supabase])

  // Show a simple loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}

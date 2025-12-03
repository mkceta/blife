'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function RootPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/market')
      } else {
        router.push('/auth/login')
      }
    }
    checkSession()
  }, [router, supabase])

  return <div className="min-h-screen flex items-center justify-center">Loading...</div>
}

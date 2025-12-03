'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/auth/login')
    }

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={handleLogout}
            className="hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
        >
            <LogOut className="h-4 w-4" />
        </Button>
    )
}

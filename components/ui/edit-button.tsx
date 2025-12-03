'use client'

import Link from 'next/link'
import { Edit } from 'lucide-react'

export function EditButton({ href }: { href: string }) {
    return (
        <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong border border-white/20 hover:border-white/40 px-1.5 py-1 rounded-md transition-all duration-300 hover:scale-110 group inline-flex items-center justify-center h-6"
        >
            <Edit className="h-3.5 w-3.5 text-white group-hover:text-primary transition-colors" />
        </Link>
    )
}

'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search, Camera, Shirt, User, Baby, Lamp, Smartphone, Book, Coins, Trophy, ChevronRight, Car, Briefcase, Package, Pencil } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
    { id: 'Electronica', label: 'Electrónica', icon: Smartphone, color: 'text-primary' },
    { id: 'LibrosApuntes', label: 'Libros y Apuntes', icon: Book, color: 'text-primary' },
    { id: 'Material', label: 'Material', icon: Pencil, color: 'text-primary' },
    { id: 'Ropa', label: 'Ropa', icon: Shirt, color: 'text-primary' },
    { id: 'Muebles', label: 'Muebles', icon: Lamp, color: 'text-primary' },
    { id: 'Transporte', label: 'Transporte', icon: Car, color: 'text-primary' },
    { id: 'Servicios', label: 'Servicios', icon: Briefcase, color: 'text-primary' },
    { id: 'Ocio', label: 'Ocio', icon: Trophy, color: 'text-primary' },
    { id: 'Otros', label: 'Otros', icon: Package, color: 'text-primary' },
]

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-background border-b p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Busca artículos o miembros"
                        className="pl-10 pr-10 bg-muted/50 border-none h-11 text-base placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    <Camera className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                </div>
            </div>

            {/* Categories Grid */}
            <div className="p-4 grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                    <Link
                        key={cat.id}
                        href={`/home?category=${cat.id}`}
                        className="group relative h-28 bg-card rounded-lg border p-4 flex flex-col justify-between hover:border-primary/50 transition-colors active:scale-[0.98] duration-100"
                    >
                        <span className="font-medium text-foreground">{cat.label}</span>
                        <cat.icon className={`h-8 w-8 self-end stroke-1 ${cat.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                    </Link>
                ))}
            </div>
        </div>
    )
}

'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { FlatFilters } from '@/features/flats/components/flat-filters';
import { Flat } from '@/lib/types';

export function FlatsSearchBar({ flats }: { flats: Flat[] }) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [isStuck, setIsStuck] = useState(false)
    const [inputValue, setInputValue] = useState(searchParams.get('q') || '')
    const timeoutRef = useRef<NodeJS.Timeout>(null)

    const handleSearch = (value: string) => {
        setInputValue(value)

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (value) {
                params.set('q', value)
            } else {
                params.delete('q')
            }
            router.replace(`/flats?${params.toString()}`)
        }, 300)
    }

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsStuck(!entry.isIntersecting)
            },
            { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
        )

        const sentinel = document.getElementById('flats-sentinel')
        if (sentinel) {
            observer.observe(sentinel)
        }

        return () => {
            if (sentinel) observer.unobserve(sentinel)
        }
    }, [])

    return (
        <div className="md:hidden relative">
            <div id="flats-sentinel" className="absolute -top-1 h-1 w-full" />
            <div className={`sticky top-0 z-40 w-full bg-background border-b border-border/5 shadow-sm transition-all duration-200 ${isStuck ? 'pt-[env(safe-area-inset-top)]' : 'pt-2'}`}>
                <div className="flex flex-col gap-2 px-3 pb-2">
                    <div className="flex gap-2 items-center">
                        <div className="flex-1 relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={inputValue}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Buscar pisos..."
                                    className="pl-9 h-9 bg-muted/50 border-border/50 focus-visible:ring-1 rounded-full text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex-none">
                            <FlatFilters flats={flats || []} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { MarketFilters } from '@/features/market/components/market-filters';
import Link from 'next/link';

export function MarketSearchBar() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const currentCategory = searchParams.get('category')
    const [inputValue, setInputValue] = useState(searchParams.get('q') || '')
    const timeoutRef = useRef<NodeJS.Timeout>(null)
    const isTypingRef = useRef(false)

    // Sync inputValue with URL query when navigation occurs (e.g., back/forward)
    // But only if user is NOT actively typing
    useEffect(() => {
        if (!isTypingRef.current) {
            setInputValue(searchParams.get('q') || '')
        }
    }, [searchParams])

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    const handleSearch = (value: string) => {
        setInputValue(value);
        isTypingRef.current = true;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set('q', value);
            } else {
                params.delete('q');
            }
            router.replace(`/market?${params.toString()}`);
            // Mark typing as done after URL update
            isTypingRef.current = false;
        }, 300);
    };

    const categories = [
        { id: null, label: 'Todo' },
        { id: 'Electronica', label: 'Electrónica' },
        { id: 'LibrosApuntes', label: 'Libros' },
        { id: 'Material', label: 'Material' },
        { id: 'Ropa', label: 'Ropa' },
        { id: 'Muebles', label: 'Muebles' },
        { id: 'Transporte', label: 'Transporte' },
        { id: 'Servicios', label: 'Servicios' },
        { id: 'Ocio', label: 'Ocio' },
        { id: 'Otros', label: 'Otros' },
    ]

    return (
        <div className="md:hidden relative z-40">
            {/* Sticky at top offset by HomeNav height (12 = 3rem) + safe area. */}
            <div
                className="sticky w-full bg-background/95 backdrop-blur-md border-b border-border/5 shadow-sm pt-2"
                style={{ top: 'calc(3rem + env(safe-area-inset-top))' }}
            >
                <div className="flex flex-col gap-2 px-3 pb-0">
                    <div className="flex gap-2 items-center">
                        <div className="flex-1 relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={inputValue}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Busca artículos o miembros"
                                    className="pl-9 h-9 bg-muted/50 border-border/50 focus-visible:ring-1 rounded-full text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex-none">
                            <MarketFilters />
                        </div>
                    </div>
                    {/* Category Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-3 -mx-3 px-3 scrollbar-hide">
                        {categories.map((cat) => {
                            const isActive = currentCategory === cat.id || (cat.id === null && !currentCategory)
                            return (
                                <Link
                                    key={cat.label}
                                    href={isActive
                                        ? '/market'
                                        : (cat.id ? `/market?category=${cat.id}` : '/market')
                                    }
                                    className={`
                                        whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
                                        ${isActive
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-transparent text-muted-foreground border-border hover:border-primary/50'
                                        }
                                    `}
                                >
                                    {cat.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

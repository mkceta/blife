'use client'; // This component must be client-side to handle input state

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

export function CommunitySearchBar({ defaultValue }: { defaultValue: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [inputValue, setInputValue] = useState(defaultValue);
    const [isPending, startTransition] = useTransition();

    const handleSearch = (term: string) => {
        setInputValue(term);
        // We only push to URL for persistence, "Instant" search inside feed is handled by client state 
        // derived from this URL or ideally, we should lift this state up or url-sync it.
        // For "Instant" feel without reload, we rely on shallow routing or query param updates

        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
    }

    return (
        <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                value={inputValue}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar en la comunidad..."
                className="pl-9 h-9 bg-muted/50 border-border/50 focus-visible:ring-1 rounded-full text-sm"
            />
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import FlatMap from '@/components/flats/flat-map-dynamic'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SlidersHorizontal } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'

const SORT_OPTIONS = [
    { value: 'newest', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'price_asc', label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' },
]

const ROOM_OPTIONS = [
    { value: '1', label: '1+ Habitaciones' },
    { value: '2', label: '2+ Habitaciones' },
    { value: '3', label: '3+ Habitaciones' },
    { value: '4', label: '4+ Habitaciones' },
]

const BATH_OPTIONS = [
    { value: '1', label: '1+ Baños' },
    { value: '2', label: '2+ Baños' },
    { value: '3', label: '3+ Baños' },
]

export function FlatFilters({ flats = [] }: { flats?: any[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    // Handle back button closing the sheet using Hash
    useEffect(() => {
        const handleHashChange = () => {
            if (window.location.hash !== '#filters') {
                setIsOpen(false)
            }
        }

        window.addEventListener('hashchange', handleHashChange)
        return () => window.removeEventListener('hashchange', handleHashChange)
    }, [])

    // Sync open state with hash
    useEffect(() => {
        if (isOpen) {
            if (window.location.hash !== '#filters') {
                window.location.hash = 'filters'
            }
        } else {
            if (window.location.hash === '#filters') {
                window.history.back()
            }
        }
    }, [isOpen])

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
    }

    const [filters, setFilters] = useState({
        minRent: searchParams.get('min_rent') || '',
        maxRent: searchParams.get('max_rent') || '',
        minRooms: searchParams.get('min_rooms') || '',
        minBaths: searchParams.get('min_baths') || '',
        minArea: searchParams.get('min_area') || '',
        maxArea: searchParams.get('max_area') || '',
        locationArea: searchParams.get('location_area') || '',
        sort: searchParams.get('sort') || 'newest',
    })

    // Sync state with URL params when they change
    useEffect(() => {
        setFilters({
            minRent: searchParams.get('min_rent') || '',
            maxRent: searchParams.get('max_rent') || '',
            minRooms: searchParams.get('min_rooms') || '',
            minBaths: searchParams.get('min_baths') || '',
            minArea: searchParams.get('min_area') || '',
            maxArea: searchParams.get('max_area') || '',
            locationArea: searchParams.get('location_area') || '',
            sort: searchParams.get('sort') || 'newest',
        })
    }, [searchParams])

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString())

        if (filters.minRent) params.set('min_rent', filters.minRent)
        else params.delete('min_rent')

        if (filters.maxRent) params.set('max_rent', filters.maxRent)
        else params.delete('max_rent')

        if (filters.minRooms && filters.minRooms !== '0') params.set('min_rooms', filters.minRooms)
        else params.delete('min_rooms')

        if (filters.minBaths && filters.minBaths !== '0') params.set('min_baths', filters.minBaths)
        else params.delete('min_baths')

        if (filters.minArea) params.set('min_area', filters.minArea)
        else params.delete('min_area')

        if (filters.maxArea) params.set('max_area', filters.maxArea)
        else params.delete('max_area')

        if (filters.locationArea) params.set('location_area', filters.locationArea)
        else params.delete('location_area')

        if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort)
        else params.delete('sort')

        // Ensure we are on the correct tab
        if (!params.has('tab')) {
            params.set('tab', 'flats')
        }

        router.push(`${pathname}?${params.toString()}`)
        handleOpenChange(false)
    }

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('min_rent')
        params.delete('max_rent')
        params.delete('min_rooms')
        params.delete('min_baths')
        params.delete('min_area')
        params.delete('max_area')
        params.delete('location_area')
        params.delete('sort')

        setFilters({
            minRent: '',
            maxRent: '',
            minRooms: '',
            minBaths: '',
            minArea: '',
            maxArea: '',
            locationArea: '',
            sort: 'newest',
        })

        router.push(`${pathname}?${params.toString()}`)
        handleOpenChange(false)
    }

    const activeFiltersCount = [
        filters.minRent,
        filters.maxRent,
        filters.minRooms,
        filters.minBaths,
        filters.minArea,
        filters.maxArea,
        filters.locationArea,
        filters.sort !== 'newest',
    ].filter(Boolean).length

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="relative rounded-full h-10 w-10 hover:bg-white/10 transition-colors">
                    <SlidersHorizontal className="h-5 w-5" />
                    {activeFiltersCount > 0 && (
                        <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-primary ring-2 ring-background shadow-glow-primary" />
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md border-l border-white/10 bg-background/80 backdrop-blur-xl p-6">
                <SheetHeader className="text-left flex flex-row items-center justify-between">
                    <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Filtros de Pisos
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-8 h-[calc(100vh-10rem)] overflow-y-auto pr-2 pb-20">
                    <div className="space-y-4">
                        <Label className="text-base font-medium text-foreground/90">Ordenar por</Label>
                        <Select
                            value={filters.sort}
                            onValueChange={(value) => setFilters({ ...filters, sort: value })}
                        >
                            <SelectTrigger className="h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 transition-all focus:ring-primary/20">
                                <SelectValue placeholder="Selecciona orden" />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-black/90 backdrop-blur-xl">
                                {SORT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="focus:bg-white/10 focus:text-primary">
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="space-y-4">
                        <Label className="text-base font-medium text-foreground/90">Mapa de Pisos</Label>
                        <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-white/10">
                            <FlatMap
                                flats={flats}
                                interactive={true}
                                className="h-full w-full"
                            />
                        </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="space-y-4">
                        <Label className="text-base font-medium text-foreground/90">Precio (Alquiler/mes)</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mínimo</Label>
                                <div className="relative group">
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={filters.minRent}
                                        onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
                                        className="h-14 rounded-2xl pl-10 border-white/10 bg-white/5 focus:bg-white/10 transition-all focus:border-primary/50"
                                    />
                                    <span className="absolute left-4 top-4 text-muted-foreground group-focus-within:text-primary transition-colors">€</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Máximo</Label>
                                <div className="relative group">
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.maxRent}
                                        onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
                                        className="h-14 rounded-2xl pl-10 border-white/10 bg-white/5 focus:bg-white/10 transition-all focus:border-primary/50"
                                    />
                                    <span className="absolute left-4 top-4 text-muted-foreground group-focus-within:text-primary transition-colors">€</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="space-y-4">
                        <Label className="text-base font-medium text-foreground/90">Características</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Habitaciones</Label>
                                <Select
                                    value={filters.minRooms}
                                    onValueChange={(value) => setFilters({ ...filters, minRooms: value })}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 transition-all focus:ring-primary/20">
                                        <SelectValue placeholder="Cualquiera" />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/10 bg-black/90 backdrop-blur-xl">
                                        <SelectItem value="0">Cualquiera</SelectItem>
                                        {ROOM_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value} className="focus:bg-white/10 focus:text-primary">
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Baños</Label>
                                <Select
                                    value={filters.minBaths}
                                    onValueChange={(value) => setFilters({ ...filters, minBaths: value })}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 transition-all focus:ring-primary/20">
                                        <SelectValue placeholder="Cualquiera" />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/10 bg-black/90 backdrop-blur-xl">
                                        <SelectItem value="0">Cualquiera</SelectItem>
                                        {BATH_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value} className="focus:bg-white/10 focus:text-primary">
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="space-y-4">
                        <Label className="text-base font-medium text-foreground/90">Superficie (m²)</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mínimo</Label>
                                <div className="relative group">
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={filters.minArea}
                                        onChange={(e) => setFilters({ ...filters, minArea: e.target.value })}
                                        className="h-14 rounded-2xl pl-10 border-white/10 bg-white/5 focus:bg-white/10 transition-all focus:border-primary/50"
                                    />
                                    <span className="absolute left-4 top-4 text-muted-foreground group-focus-within:text-primary transition-colors">m²</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Máximo</Label>
                                <div className="relative group">
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.maxArea}
                                        onChange={(e) => setFilters({ ...filters, maxArea: e.target.value })}
                                        className="h-14 rounded-2xl pl-10 border-white/10 bg-white/5 focus:bg-white/10 transition-all focus:border-primary/50"
                                    />
                                    <span className="absolute left-4 top-4 text-muted-foreground group-focus-within:text-primary transition-colors">m²</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-10">
                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={clearFilters}
                            className="flex-1 h-14 rounded-2xl border-white/10 hover:bg-white/5 hover:text-primary hover:border-primary/20 transition-all"
                        >
                            Limpiar
                        </Button>
                        <Button
                            type="button"
                            onClick={applyFilters}
                            className="flex-[2] h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all font-medium text-base"
                        >
                            Aplicar Filtros
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

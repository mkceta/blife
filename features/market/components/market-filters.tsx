'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SlidersHorizontal } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORIES = [
    'Todos',
    'Electronica',
    'LibrosApuntes',
    'Material',
    'Ropa',
    'Muebles',
    'Transporte',
    'Servicios',
    'Ocio',
    'Otros'
]

const SORT_OPTIONS = [
    { value: 'most_liked', label: 'Más gustados' },
    { value: 'newest', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'price_asc', label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' },
]

const DEGREES = [
    'Todos',
    'Grado en Ingeniería Informática',
    'Grado en Ingeniería Industrial',
    'Grado en Administración y Dirección de Empresas',
    'Grado en Enfermería',
    'Grado en Arquitectura',
    'Grado en Biología',
    'Grado en Derecho',
    'Grado en Educación Infantil',
    'Grado en Educación Primaria',
    'Grado en Fisioterapia',
    'Otro'
]

const SIZES = [
    'Todos',
    'XS', 'S', 'M', 'L', 'XL', 'XXL',
    '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'
]

// ... previous code ...

export function MarketFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    // Handle back button closing the sheet using Hash - COMMENTED OUT TO FIX ROUTING
    /*
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
                // If we closed it programmatically, go back to remove hash
                window.history.back()
            }
        }
    }, [isOpen])
    */

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
    }

    const [filters, setFilters] = useState({
        category: searchParams.get('category') || 'Todos',
        degree: searchParams.get('degree') || 'Todos',
        minPrice: searchParams.get('min_price') || '',
        maxPrice: searchParams.get('max_price') || '',
        sort: searchParams.get('sort') || 'newest',
        size: searchParams.get('size') || 'Todos',
    })

    // Sync state with URL params
    useEffect(() => {
        setFilters({
            category: searchParams.get('category') || 'Todos',
            degree: searchParams.get('degree') || 'Todos',
            minPrice: searchParams.get('min_price') || '',
            maxPrice: searchParams.get('max_price') || '',
            sort: searchParams.get('sort') || 'newest',
            size: searchParams.get('size') || 'Todos',
        })
    }, [searchParams])

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString())

        // ... existing params logic ... 
        if (filters.category && filters.category !== 'Todos') {
            params.set('category', filters.category)
        } else {
            params.delete('category')
        }

        if (filters.degree && filters.degree !== 'Todos') {
            params.set('degree', filters.degree)
        } else {
            params.delete('degree')
        }

        if (filters.size && filters.size !== 'Todos') {
            params.set('size', filters.size)
        } else {
            params.delete('size')
        }

        if (filters.minPrice) {
            params.set('min_price', filters.minPrice)
        } else {
            params.delete('min_price')
        }

        if (filters.maxPrice) {
            params.set('max_price', filters.maxPrice)
        } else {
            params.delete('max_price')
        }

        if (filters.sort && filters.sort !== 'newest') {
            params.set('sort', filters.sort)
        } else {
            params.delete('sort')
        }

        // ...

        if (!params.has('tab')) {
            params.set('tab', 'market')
        }

        router.push(`${pathname}?${params.toString()}`)
        router.refresh()
        handleOpenChange(false)
    }

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('category')
        params.delete('degree')
        params.delete('min_price')
        params.delete('max_price')
        params.delete('sort')
        params.delete('size') // Clear size

        setFilters({
            category: 'Todos',
            degree: 'Todos',
            minPrice: '',
            maxPrice: '',
            sort: 'newest',
            size: 'Todos',
        })

        router.push(`${pathname}?${params.toString()}`)
        router.refresh()
        handleOpenChange(false)
    }

    const activeFiltersCount = [
        filters.category !== 'Todos',
        filters.degree !== 'Todos',
        filters.minPrice,
        filters.maxPrice,
        filters.sort !== 'newest',
        filters.size !== 'Todos',
    ].filter(Boolean).length

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="relative rounded-full h-10 w-10 hover:bg-white/10 transition-colors">
                    <SlidersHorizontal className="h-5 w-5" />
                    <AnimatePresence>
                        {activeFiltersCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="absolute top-0 right-0 h-3 w-3 rounded-full bg-primary ring-2 ring-background shadow-glow-primary"
                            />
                        )}
                    </AnimatePresence>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md border-l border-white/10 bg-background/80 backdrop-blur-xl p-6">
                <SheetHeader className="text-left flex flex-row items-center justify-between">
                    <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Filtros y Ordenación
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-8 h-[calc(100vh-10rem)] overflow-y-auto pr-2">
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
                        <Label className="text-base font-medium text-foreground/90">Categoría</Label>
                        <Select
                            value={filters.category}
                            onValueChange={(value) => setFilters({ ...filters, category: value })}
                        >
                            <SelectTrigger className="h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 transition-all focus:ring-primary/20">
                                <SelectValue placeholder="Selecciona categoría" />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-black/90 backdrop-blur-xl max-h-[300px]">
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat} className="focus:bg-white/10 focus:text-primary">
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {filters.category === 'Ropa' && (
                        <>
                            <Separator className="bg-white/10" />
                            <div className="space-y-4">
                                <Label className="text-base font-medium text-foreground/90">Talla</Label>
                                <Select
                                    value={filters.size}
                                    onValueChange={(value) => setFilters({ ...filters, size: value })}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 transition-all focus:ring-primary/20">
                                        <SelectValue placeholder="Selecciona talla" />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/10 bg-black/90 backdrop-blur-xl max-h-[300px]">
                                        {SIZES.map((size) => (
                                            <SelectItem key={size} value={size} className="focus:bg-white/10 focus:text-primary">
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    <Separator className="bg-white/10" />

                    <div className="space-y-4">
                        <Label className="text-base font-medium text-foreground/90">Grado del Vendedor</Label>
                        <Select
                            value={filters.degree}
                            onValueChange={(value) => setFilters({ ...filters, degree: value })}
                        >
                            <SelectTrigger className="h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 transition-all focus:ring-primary/20">
                                <SelectValue placeholder="Selecciona grado" />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-black/90 backdrop-blur-xl max-h-[300px]">
                                {DEGREES.map((degree) => (
                                    <SelectItem key={degree} value={degree} className="focus:bg-white/10 focus:text-primary">
                                        {degree}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="space-y-4">
                        <Label className="text-base font-medium text-foreground/90">Rango de Precio</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mínimo</Label>
                                <div className="relative group">
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={filters.minPrice}
                                        onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
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
                                        value={filters.maxPrice}
                                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                        className="h-14 rounded-2xl pl-10 border-white/10 bg-white/5 focus:bg-white/10 transition-all focus:border-primary/50"
                                    />
                                    <span className="absolute left-4 top-4 text-muted-foreground group-focus-within:text-primary transition-colors">€</span>
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

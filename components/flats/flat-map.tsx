'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import L from 'leaflet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Maximize2, Minimize2, MapPin } from 'lucide-react'
import { toast } from 'sonner'

// Fix for Leaflet icons
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png'
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png'
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
})

// Custom Icon for Selected Location
const selectedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function MapController({ center, zoom }: { center?: [number, number], zoom?: number }) {
    const map = useMap()
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || 16, {
                duration: 1.5
            })
        }
    }, [center, zoom, map])
    return null
}

function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onClick?.(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

export default function FlatMap({
    flats = [],
    preciseLocation,
    onLocationSelect,
    className,
    interactive = true
}: {
    flats?: any[]
    preciseLocation?: { lat: number, lng: number } | null
    onLocationSelect?: (lat: number, lng: number) => void
    className?: string
    interactive?: boolean
}) {
    const [mounted, setMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [mapCenter, setMapCenter] = useState<[number, number]>([43.3623, -8.4115]) // A Coruña default

    useEffect(() => {
        setMounted(true)
        if (preciseLocation) {
            setMapCenter([preciseLocation.lat, preciseLocation.lng])
        }
    }, [preciseLocation])

    const toggleFullscreen = () => {
        if (!containerRef.current) return

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => {
                setIsFullscreen(true)
            }).catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)
            })
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false)
            })
        }
    }

    // Handle fullscreen change event to update state if user presses Esc
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFull = !!document.fullscreenElement
            setIsFullscreen(isFull)

            // Fix for mobile viewports getting messed up after fullscreen
            if (!isFull) {
                // Force a viewport reset
                const viewport = document.querySelector('meta[name="viewport"]')
                if (viewport) {
                    const originalContent = viewport.getAttribute('content')
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1')
                    setTimeout(() => {
                        if (originalContent) viewport.setAttribute('content', originalContent)
                    }, 100)
                }
            }
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const handleSearch = async (e?: React.FormEvent | React.MouseEvent) => {
        e?.preventDefault()
        if (!searchQuery.trim()) return

        setIsSearching(true)
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', A Coruña, España')}`)
            const data = await response.json()

            if (data && data.length > 0) {
                const { lat, lon } = data[0]
                const newLat = parseFloat(lat)
                const newLng = parseFloat(lon)
                setMapCenter([newLat, newLng])
                // Optional: Auto-select location on search? Maybe better to just move map.
                // onLocationSelect?.(newLat, newLng) 
                toast.success('Ubicación encontrada')
            } else {
                toast.error('No se encontró la dirección')
            }
        } catch (error) {
            console.error('Search error:', error)
            toast.error('Error al buscar')
        } finally {
            setIsSearching(false)
        }
    }

    if (!mounted) return <div className="h-full w-full bg-muted/20 animate-pulse rounded-xl" />

    return (
        <div ref={containerRef} className={cn("relative h-full w-full rounded-xl overflow-hidden group isolate", className)}>
            {/* Search Bar */}
            {interactive && (
                <div className="absolute top-4 left-4 z-[1000] w-[calc(100%-6rem)] max-w-sm">
                    <div className="relative flex items-center shadow-lg rounded-xl overflow-hidden bg-background/90 backdrop-blur-sm border border-border/50">
                        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSearch()
                                }
                            }}
                            placeholder="Buscar calle o zona..."
                            className="pl-9 pr-4 h-10 border-0 bg-transparent focus-visible:ring-0"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleSearch}
                            className="h-10 px-3 rounded-none hover:bg-primary/10 hover:text-primary"
                            disabled={isSearching}
                        >
                            {isSearching ? '...' : 'Ir'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Fullscreen Toggle */}
            <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-4 right-4 z-[1000] shadow-lg bg-background/90 backdrop-blur-sm hover:bg-background"
                onClick={toggleFullscreen}
            >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <MapContainer
                key="flat-map-container"
                center={mapCenter}
                zoom={13}
                scrollWheelZoom={interactive}
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <MapController center={mapCenter} />

                {interactive && onLocationSelect && <MapClickHandler onClick={onLocationSelect} />}

                {/* Selected Location Marker (for New Flat) */}
                {preciseLocation && (
                    <Marker position={[preciseLocation.lat, preciseLocation.lng]} icon={selectedIcon}>
                        <Popup>Ubicación seleccionada</Popup>
                    </Marker>
                )}

                {/* Available Flats Markers */}
                {flats.map(flat => {
                    if (flat.lat && flat.lng && flat.id) {
                        return (
                            <Marker key={flat.id} position={[flat.lat, flat.lng]}>
                                <Popup className="glass-popup p-0 overflow-hidden rounded-xl border-none shadow-xl">
                                    <div className="w-[220px] bg-background/95 backdrop-blur-md rounded-xl overflow-hidden border border-border/50">
                                        <div className="relative h-28 w-full bg-muted">
                                            {flat.photos && flat.photos[0] ? (
                                                <img
                                                    src={flat.photos[0].url}
                                                    alt={flat.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-secondary/30">
                                                    <MapPin className="h-8 w-8 text-muted-foreground/30" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2">
                                                <span className="px-2 py-1 text-xs font-bold bg-black/60 text-white backdrop-blur-sm rounded-md border border-white/10">
                                                    {(flat.rent_cents / 100).toFixed(0)}€
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-3 space-y-2">
                                            <h3 className="font-semibold text-sm line-clamp-1">{flat.title}</h3>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <div className="flex gap-2">
                                                    <span>{flat.rooms} hab.</span>
                                                    <span>•</span>
                                                    <span>{flat.area_m2} m²</span>
                                                </div>
                                            </div>
                                            <Button asChild size="sm" className="w-full h-8 text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shadow-none">
                                                <a href={`/flats/view?id=${flat.id}`} target="_blank" rel="noopener noreferrer">
                                                    Ver Anuncio
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    }
                    return null
                })}
            </MapContainer>
        </div>
    )
}

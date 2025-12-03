'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import { cn } from '@/lib/utils'
import { MapPin } from 'lucide-react'

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

function MapController({ center }: { center: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        map.flyTo(center, 15, {
            duration: 1.5
        })
    }, [center, map])
    return null
}

interface ListingMapProps {
    location: string
    className?: string
}

export default function ListingMap({ location, className }: ListingMapProps) {
    const [coords, setCoords] = useState<[number, number] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        async function geocode() {
            if (!location) return

            try {
                // Append 'A Coruña, España' to context
                const query = `${location}, A Coruña, España`
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
                const data = await response.json()

                if (data && data.length > 0) {
                    setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)])
                } else {
                    // Fallback to generic A Coruña center if specific location fails
                    // or set error to show placeholder
                    setError(true)
                }
            } catch (err) {
                console.error('Geocoding error:', err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        geocode()
    }, [location])

    if (loading) {
        return (
            <div className={cn("h-48 w-full rounded-2xl bg-muted animate-pulse flex items-center justify-center", className)}>
                <MapPin className="h-8 w-8 text-muted-foreground/30 animate-bounce" />
            </div>
        )
    }

    if (error || !coords) {
        return (
            <div className={cn("h-48 w-full rounded-2xl bg-muted/50 flex items-center justify-center border", className)}>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <MapPin className="h-6 w-6 opacity-50" />
                    <p className="text-sm">Ubicación aproximada: {location}</p>
                </div>
            </div>
        )
    }

    return (
        <div className={cn("relative h-48 w-full rounded-2xl overflow-hidden border z-0", className)}>
            <MapContainer
                center={coords}
                zoom={15}
                scrollWheelZoom={false}
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={coords}>
                    <Popup>{location}</Popup>
                </Marker>
                <MapController center={coords} />
            </MapContainer>
        </div>
    )
}

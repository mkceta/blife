'use client'

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { cn } from '@/lib/utils'
import { Flat } from '@/lib/types'

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

export interface FlatMapComponentProps {
    preciseLocation?: { lat: number; lng: number } | null
    flats?: Flat[]
    interactive?: boolean
    onLocationSelect?: (lat: number, lng: number) => void
    className?: string
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            if (onLocationSelect) {
                onLocationSelect(e.latlng.lat, e.latlng.lng)
            }
        },
    })
    return null
}

export default function FlatMapComponent({ preciseLocation, flats, interactive = true, onLocationSelect, className }: FlatMapComponentProps) {
    // Default center (A Coruña, Spain) when no location is set
    const defaultCenter: [number, number] = [43.3623, -8.4115]

    // Determine center priority: preciseLocation > first flat > default
    let center: [number, number] = defaultCenter
    if (preciseLocation) {
        center = [preciseLocation.lat, preciseLocation.lng]
    } else if (flats && flats.length > 0) {
        const firstFlatWithLocation = flats.find(f => f.precise_location)
        if (firstFlatWithLocation?.precise_location) {
            center = [firstFlatWithLocation.precise_location.lat, firstFlatWithLocation.precise_location.lng]
        }
    }

    return (
        <div className={cn("relative h-full w-full overflow-hidden z-0", className)}>
            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={interactive}
                dragging={interactive}
                zoomControl={interactive}
                doubleClickZoom={interactive}
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {preciseLocation && (
                    <Marker position={[preciseLocation.lat, preciseLocation.lng]}>
                        <Popup>Ubicación del piso</Popup>
                    </Marker>
                )}

                {flats?.map((flat) => (
                    flat.precise_location ? (
                        <Marker
                            key={flat.id}
                            position={[flat.precise_location.lat, flat.precise_location.lng]}
                        >
                            <Popup className="min-w-[200px]">
                                <div className="space-y-2">
                                    <h3 className="font-bold text-sm">{flat.title}</h3>
                                    <p className="text-sm font-medium">{flat.rent_cents / 100}€/mes</p>
                                    <a href={`/flats/${flat.id}`} className="text-xs text-primary underline">Ver detalles</a>
                                </div>
                            </Popup>
                        </Marker>
                    ) : null
                ))}

                {onLocationSelect && <MapClickHandler onLocationSelect={onLocationSelect} />}
            </MapContainer>
        </div>
    )
}

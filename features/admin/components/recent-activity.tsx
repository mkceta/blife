import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import type { Photo } from '@/lib/types'

// Partial types for recent activity - only the fields we need
interface RecentUser {
    id: string
    alias_inst: string
    avatar_url?: string | null
    created_at: string
}

interface RecentListing {
    id: string
    title: string
    price_cents: number
    photos: Photo[]
    created_at: string
}

interface RecentFlat {
    id: string
    title: string
    rent_cents: number
    photos: Photo[]
    created_at: string
}

interface RecentActivityProps {
    newUsers: RecentUser[]
    newListings: RecentListing[]
    newFlats: RecentFlat[]
}

export function RecentActivity({ newUsers, newListings, newFlats }: RecentActivityProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Nuevos Usuarios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {newUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={user.avatar_url || undefined} />
                                    <AvatarFallback>{user.alias_inst?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium leading-none">@{user.alias_inst}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(user.created_at), { locale: es, addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                            <Link href={`/user/@${user.alias_inst}`} className="text-xs text-primary hover:underline">
                                Ver perfil
                            </Link>
                        </div>
                    ))}
                    {newUsers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay usuarios nuevos</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Últimos Anuncios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {newListings.map((listing) => (
                        <div key={listing.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded bg-muted overflow-hidden relative">
                                    {listing.photos?.[0]?.url && (
                                        <img src={listing.photos[0].url} alt="" className="object-cover w-full h-full" loading="lazy" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium leading-none truncate max-w-[150px]">{listing.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {(listing.price_cents / 100).toFixed(2)}€
                                    </p>
                                </div>
                            </div>
                            <Link href={`/market/product?id=${listing.id}`} className="text-xs text-primary hover:underline">
                                Ver
                            </Link>
                        </div>
                    ))}
                    {newListings.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay anuncios nuevos</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Últimos Pisos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {newFlats.map((flat) => (
                        <div key={flat.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded bg-muted overflow-hidden relative">
                                    {flat.photos?.[0]?.url && (
                                        <img src={flat.photos[0].url} alt="" className="object-cover w-full h-full" loading="lazy" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium leading-none truncate max-w-[150px]">{flat.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {(flat.rent_cents / 100).toFixed(0)}€/mes
                                    </p>
                                </div>
                            </div>
                            <Link href={`/flats/view?id=${flat.id}`} className="text-xs text-primary hover:underline">
                                Ver
                            </Link>
                        </div>
                    ))}
                    {newFlats.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay pisos nuevos</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}


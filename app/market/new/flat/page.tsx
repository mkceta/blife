'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { uploadFlatImages } from '@/lib/upload'
import Image from 'next/image'
import { X, Upload, Check } from 'lucide-react'
import FlatMap from '@/components/flats/flat-map-dynamic'
import { ImageUpload } from '@/components/ui/image-upload'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const AMENITIES_OPTIONS = [
    { id: 'wifi', label: 'WiFi / Internet' },
    { id: 'washing_machine', label: 'Lavadora' },
    { id: 'dishwasher', label: 'Lavavajillas' },
    { id: 'heating', label: 'Calefacción' },
    { id: 'ac', label: 'Aire Acondicionado' },
    { id: 'tv', label: 'Televisión' },
    { id: 'elevator', label: 'Ascensor' },
    { id: 'terrace', label: 'Terraza / Balcón' },
    { id: 'oven', label: 'Horno' },
    { id: 'microwave', label: 'Microondas' },
    { id: 'dryer', label: 'Secadora' },
    { id: 'garage', label: 'Garaje' },
]

const formSchema = z.object({
    title: z.string().min(10, 'Mínimo 10 caracteres').max(100),
    description: z.string().min(20, 'Describe mejor el piso').max(1500),
    rent: z.preprocess((val) => Number(val), z.number().min(50, 'Mínimo 50€')),
    rooms: z.preprocess((val) => Number(val), z.number().min(1).max(20).optional()),
    baths: z.preprocess((val) => Number(val), z.number().min(1).max(10).optional()),
    area_m2: z.preprocess((val) => Number(val), z.number().min(10).max(500).optional()),
    location_area: z.string().optional(), // Deprecated but kept for schema compatibility 
    roommates_current: z.preprocess((val) => Number(val), z.number().min(0).max(20).optional()),
    lat: z.number(),
    lng: z.number(),
    amenities: z.array(z.string()).optional(),
})

export default function NewFlatPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])

    const form = useForm<any>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            rent: 0,
            location_area: '',
            rooms: undefined,
            baths: undefined,
            area_m2: undefined,
            roommates_current: undefined,
            lat: undefined,
            lng: undefined,
            amenities: [],
        },
    })

    const handleFilesChange = (newFiles: File[]) => {
        setFiles(newFiles)
    }

    const removeFile = (index: number) => {
        const newFiles = [...files]
        newFiles.splice(index, 1)
        setFiles(newFiles)
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (files.length < 5) {
            toast.error('Debes subir al menos 5 fotos')
            return
        }

        setIsLoading(true)
        const supabase = createClient()
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            const { data: flat, error } = await supabase
                .from('flats')
                .insert({
                    user_id: user.id,
                    title: values.title,
                    description: values.description,
                    rent_cents: Math.round(values.rent * 100),
                    rooms: values.rooms,
                    baths: values.baths,
                    area_m2: values.area_m2,
                    location_area: values.location_area || 'custom',
                    roommates_current: values.roommates_current,
                    lat: values.lat,
                    lng: values.lng,
                    amenities: values.amenities || [],
                    status: 'active',
                })
                .select()
                .single()

            if (error) throw error

            // Upload images
            const uploadedPhotos = await uploadFlatImages(files, flat.id)

            // Update flat with photos
            const { error: updateError } = await supabase
                .from('flats')
                .update({ photos: uploadedPhotos })
                .eq('id', flat.id)

            if (updateError) throw updateError

            toast.success('Piso publicado')
            router.push(`/flats/${flat.id}`)
            router.refresh()

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Error al publicar')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-[100dvh] bg-background">
            <div className="flex items-center gap-2 p-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b shrink-0 z-30 bg-background/80 backdrop-blur-md">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/market/new">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold">Publicar Piso</h1>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-y-contain pb-32">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6 pb-safe container max-w-md mx-auto">
                        <div className="space-y-4">
                            <FormLabel>Fotos del piso (Mínimo 5)</FormLabel>
                            <ImageUpload
                                value={files}
                                onChange={handleFilesChange}
                                onRemove={removeFile}
                                maxFiles={10}
                            />
                            {files.length < 5 && (
                                <p className="text-sm text-destructive">
                                    Faltan {5 - files.length} fotos para poder publicar
                                </p>
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Habitación en piso compartido cerca campus" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="rent"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Alquiler (€/mes)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="roommates_current"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Compañeros</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="2" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="lat"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ubicación (Haz clic en el mapa)</FormLabel>
                                    <FormControl>
                                        <div className="space-y-3">
                                            <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-input bg-muted/10 shadow-inner">
                                                <FlatMap
                                                    preciseLocation={field.value && form.watch('lng') ? { lat: field.value, lng: form.watch('lng') } : null}
                                                    onLocationSelect={(lat, lng) => {
                                                        form.setValue('lat', lat)
                                                        form.setValue('lng', lng)
                                                        toast.success('Ubicación actualizada')
                                                    }}
                                                />
                                            </div>

                                            {field.value ? (
                                                <div className="flex items-center justify-between bg-primary/10 px-4 py-3 rounded-xl border border-primary/20">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                                        <span className="text-sm font-medium text-primary">
                                                            Ubicación marcada correctamente
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                                                    <span>⚠️</span>
                                                    <span>Es obligatorio marcar la ubicación exacta en el mapa</span>
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="rooms"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Habs.</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="3" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="baths"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Baños</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="1" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="area_m2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>m²</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="80" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="amenities"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Comodidades</FormLabel>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {AMENITIES_OPTIONS.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                                                onClick={() => {
                                                    const checked = field.value?.includes(item.id)
                                                    if (checked) {
                                                        field.onChange(field.value?.filter((value: string) => value !== item.id))
                                                    } else {
                                                        field.onChange([...(field.value || []), item.id])
                                                    }
                                                }}
                                            >
                                                <div
                                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary ${field.value?.includes(item.id)
                                                        ? "bg-primary text-primary-foreground"
                                                        : "opacity-50 [&_svg]:invisible"
                                                        }`}
                                                >
                                                    <Check className={`h-3 w-3 ${field.value?.includes(item.id) ? "visible" : "invisible"}`} />
                                                </div>
                                                <span className="font-normal cursor-pointer w-full pointer-events-none text-sm">
                                                    {item.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe el piso, servicios incluidos, ambiente..."
                                            className="min-h-[150px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Added generous padding bottom to form content to clear dynamic footer */}
                        <div className="pb-24" />

                        {/* Sticky Footer */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
                            <div className="container max-w-md mx-auto">
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                                    size="lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Publicando...
                                        </>
                                    ) : (
                                        'Publicar Piso'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}

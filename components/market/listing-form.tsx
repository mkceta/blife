'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2, ChevronRight, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { uploadListingImages } from '@/lib/upload'
import { ImageUpload } from '@/components/ui/image-upload'
import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog'
import { cn } from '@/lib/utils'

const CATEGORIES = ['Electronica', 'LibrosApuntes', 'Material', 'Ropa', 'Muebles', 'Transporte', 'Servicios', 'Ocio', 'Otros']

const formSchema = z.object({
    title: z.string().min(5, 'Mínimo 5 caracteres').max(80, 'Máximo 80 caracteres'),
    description: z.string().min(20, 'Describe un poco mejor el producto').max(1200),
    price: z.preprocess((val) => Number(val), z.number().min(0, 'El precio no puede ser negativo')),
    category: z.string().min(1, 'Selecciona una categoría'),
    brand: z.string().optional(),
    size: z.string().optional(),
    condition: z.string().optional(),
})

interface ListingFormProps {
    initialData?: any
    listingId?: string
}

export function ListingForm({ initialData, listingId }: ListingFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [existingPhotos, setExistingPhotos] = useState<any[]>(initialData?.photos || [])

    const router = useRouter()
    const supabase = createClient()

    const form = useForm<any>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            price: initialData ? initialData.price_cents / 100 : '',
            category: initialData?.category || '',
            brand: initialData?.brand || '',
            size: initialData?.size || '',
            condition: initialData?.condition || '',
        },
    })

    const handleFilesChange = (newFiles: File[]) => {
        setFiles(newFiles)
    }

    const removeNewFile = (index: number) => {
        const newFilesList = [...files]
        newFilesList.splice(index, 1)
        setFiles(newFilesList)
    }

    const removeExistingPhoto = (index: number) => {
        const newExisting = [...existingPhotos]
        newExisting.splice(index, 1)
        setExistingPhotos(newExisting)
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (files.length === 0 && existingPhotos.length === 0) {
            toast.error('Añade al menos una foto')
            return
        }

        // Clean up optional fields if category is not 'Ropa'
        if (values.category !== 'Ropa') {
            values.brand = undefined
            values.size = undefined
            values.condition = undefined
        }

        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            let targetListingId: string

            if (!listingId) {
                // CREATE MODE
                const { data: listing, error: dbError } = await supabase
                    .from('listings')
                    .insert({
                        user_id: user.id,
                        title: values.title,
                        description: values.description,
                        price_cents: Math.round(Number(values.price) * 100),
                        category: values.category,
                        brand: values.brand,
                        size: values.size,
                        condition: values.condition,
                        status: 'active',
                    })
                    .select()
                    .single()

                if (dbError) throw dbError
                targetListingId = listing.id
            } else {
                // UPDATE MODE
                targetListingId = listingId
                const { error: updateError } = await supabase
                    .from('listings')
                    .update({
                        title: values.title,
                        description: values.description,
                        price_cents: Math.round(Number(values.price) * 100),
                        category: values.category,
                        brand: values.brand,
                        size: values.size,
                        condition: values.condition,
                    })
                    .eq('id', targetListingId)

                if (updateError) throw updateError
            }

            // Upload New Images if any
            let uploadedPhotos: any[] = []
            if (files.length > 0) {
                uploadedPhotos = await uploadListingImages(files, targetListingId)
            }

            // Combine existing (kept) photos with new uploaded ones
            const finalPhotos = [...existingPhotos, ...uploadedPhotos]

            // Update Listing with Final Photos
            const { error: photoError } = await supabase
                .from('listings')
                .update({ photos: finalPhotos })
                .eq('id', targetListingId)

            if (photoError) throw photoError

            toast.success(listingId ? 'Anuncio actualizado' : 'Anuncio publicado')
            router.push(`/market/product?id=${targetListingId}`)
            router.refresh()

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Error al guardar')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!listingId) return
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', listingId)
                .eq('user_id', user.id)

            if (error) throw error

            toast.success('Anuncio eliminado')
            router.push('/market')
            router.refresh()
        } catch (error: any) {
            console.error('Error deleting listing:', error)
            toast.error('Error al eliminar el anuncio')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-32 pb-safe">

                {/* Visual Section: Photos */}
                <div className="space-y-4">
                    <ImageUpload
                        value={files}
                        onChange={handleFilesChange}
                        onRemove={removeNewFile}
                        maxFiles={20}
                        existingImages={existingPhotos.map(p => p.url)}
                        onRemoveExisting={removeExistingPhoto}
                    />
                </div>

                {/* Details Section */}
                <div className="bg-card rounded-xl border overflow-hidden divide-y divide-border/50">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem className="flex flex-col p-4">
                                <FormLabel className="text-base font-normal text-muted-foreground mb-1">Título</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Indica claramente qué vendes"
                                        className="border-none bg-transparent p-0 h-auto text-base placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem className="flex flex-col p-4 pt-2">
                                <FormLabel className="text-base font-normal text-muted-foreground mb-1">Describe tu artículo</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Añade información detallada"
                                        className="min-h-[120px] border-none bg-transparent p-0 resize-none text-base placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Categorization Section */}
                <div className="bg-card rounded-xl border overflow-hidden divide-y divide-border/50">
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                                <FormLabel className="text-base font-normal text-muted-foreground cursor-pointer flex-1">Categoría</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-[180px] border-none bg-transparent shadow-none p-0 h-auto justify-end focus:ring-0 text-right text-base font-medium">
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent align="end">
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Conditional Fields for 'Ropa' */}
                {form.watch('category') === 'Ropa' && (
                    <div className="bg-card rounded-xl border overflow-hidden divide-y divide-border/50 animate-in fade-in slide-in-from-top-4 duration-300">
                        <FormField
                            control={form.control}
                            name="brand"
                            render={({ field }) => (
                                <FormItem className="flex flex-col p-4">
                                    <FormLabel className="text-base font-normal text-muted-foreground mb-1">Marca</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej. Zara, Nike..."
                                            className="border-none bg-transparent p-0 h-auto text-base placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="size"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between p-4">
                                    <FormLabel className="text-base font-normal text-muted-foreground flex-1">Talla</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej. M, 38..."
                                            className="w-32 text-right border-none bg-transparent p-0 h-auto text-base placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="condition"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                                    <FormLabel className="text-base font-normal text-muted-foreground cursor-pointer flex-1">Estado</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-[180px] border-none bg-transparent shadow-none p-0 h-auto justify-end focus:ring-0 text-right text-base font-medium">
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent align="end">
                                            {['Nuevo con etiquetas', 'Nuevo sin etiquetas', 'Muy bueno', 'Bueno', 'Satisfactorio'].map((cond) => (
                                                <SelectItem key={cond} value={cond}>
                                                    {cond}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                {/* Price Section */}
                <div className="bg-card rounded-xl border overflow-hidden divide-y divide-border/50">
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4">
                                <FormLabel className="text-base font-normal text-muted-foreground flex-1">Precio</FormLabel>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-24 text-right border-none bg-transparent p-0 h-auto text-base font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                                            {...field}
                                        />
                                    </FormControl>
                                    <span className="text-base font-medium">€</span>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Submit Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t pb-[calc(1rem+env(safe-area-inset-bottom))] z-20">
                    <div className="container max-w-md mx-auto">
                        <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {listingId ? 'Guardando...' : 'Publicando...'}
                                </>
                            ) : (
                                listingId ? 'Guardar Cambios' : 'Publicar Anuncio'
                            )}
                        </Button>
                    </div>
                </div>

                {/* Delete Button (if editing) */}
                {listingId && (
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isLoading}
                    >
                        Eliminar anuncio
                    </Button>
                )}

                <DeleteConfirmationDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    title={form.getValues('title')}
                    itemType="anuncio"
                    onConfirm={handleDelete}
                />
            </form>
        </Form>
    )
}

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { uploadListingImages } from '@/lib/upload'
import { ImageUpload } from '@/components/ui/image-upload'
import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog'
import { StripeConnectModal } from '@/components/payment/stripe-connect-modal'

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

    // Stripe States
    const [showStripeInfoDialog, setShowStripeInfoDialog] = useState(false)
    const [showConnectModal, setShowConnectModal] = useState(false)

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
            // STRIPE CHECK FOR PAID ITEMS
            // We still do this client side for now as it involves interaction
            if (Number(values.price) > 0) {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: stripeAccount } = await supabase
                        .from('stripe_accounts')
                        .select('charges_enabled')
                        .eq('user_id', user.id)
                        .single()

                    if (!stripeAccount?.charges_enabled) {
                        setShowStripeInfoDialog(true)
                        setIsLoading(false)
                        return
                    }
                }
            }

            // Client-side image upload first
            // We need a Listing ID for the upload path... 
            // If creating, we don't have one?  
            // Actually uploadListingImages uses passed ID. If we don't have one, we can generate a temporary UUID or just use a placeholder.
            // But wait, uploadListingImages uploads to `${listingId}/originals/...`.
            // If we are creating, we don't have the ID yet.
            // Strategies:
            // 1. Create row first, then upload? (Current strat).
            // 2. Upload to a temp folder, then move? (Hard).
            // 3. Generate UUID on client?

            // Revert to Hybrid approach:
            // Create/Update ROW via Server Action? No, if we need ID for images.

            // Correction: To be "Instant", we mostly care about the FINAL redirect.
            // The bottleneck is Image Upload.
            // If we stick to:
            // 1. Create Row (Server Action?) -> Returns ID.
            // 2. Upload Images (Client).
            // 3. Update Row with Photos (Server Action + Revalidate + Redirect).

            // This is actually 2 server calls.

            // Better: Generate UUID on client (for folder path only), upload images, then create row with that ID (unlikely allowed due to security policies often requiring matching IDs) OR 
            // Just use a random UUID for the folder folder. The DB ID doesn't HAVE to match the storage folder, but it helps organization.

            // Let's stick to the flow working, but use the ACTIONS for the final "Commit".

            // Step 1: Resolve Target ID
            let targetId = listingId
            let isNew = !listingId

            if (!targetId) {
                // We need an ID to upload images.
                // Let's create the row first to get the ID.
                // But if we create the row, we want to do it "silently" or knowing it's incomplete?
                // Or just use a random folder ID.
                // Let's use crypto.randomUUID() for the storage folder.
                // Wait, `uploadListingImages` puts it in `${listingId}/...`
                // If we upload to `temp-new-id/...`, we can store that in the DB.
            }

            // To minimize refactor risk while ensuring "Instant" RELOAD:
            // We can keep the current logic but REPLACE the final router.push with a Server Action that does nothing but revalidate and redirect?
            // No, that's silly.

            // The best way for instant "Delete" is easy -> Server Action.
            // For "Create", the user sees a spinner anyway.
            // The issue is likely that after creation, the list is stale.
            // So executing the INSERT on the server side (via action) ensures revalidation happens.

            // Modified Flow:
            // 1. Upload Images (if any). If new, we need an ID.
            //    - If we don't have an ID, we can't upload to the final folder.
            //    - We can create the Listing *first* via Server Action (returning ID), but NOT redirect yet.
            // 2. Upload images to that ID.
            // 3. Call `updateListingAction` with the photos and redirect.

            // Let's import the actions.
            const { createListingActionWithRedirect, updateListingAction, deleteListingAction } = await import('@/app/market/actions')

            // Wait, I didn't export createListingActionReturnId. 
            // For now, let's just use the client-side ID generation (Supabase allows client generated IDs if RLS permits, or we just utilize the system).

            // Actually, `uploadListingImages` depends on `listingId`.
            // Let's use `crypto.randomUUID()` if no listingId exists, use that for storage, and pass it to createListing.
            // Supabase 'listings' table 'id' is uuid default gen_random_uuid().
            // We can override it? Or just store the bucket path separately?
            // The `uploadListingImages` function uses `listingId` for the path: `${listingId}/originals/...`

            // Simple approach:
            // 1. If NEW: Create a "Draft" or just Create empty listing via Server Action to get ID?
            //    Or just upload to a random UUID folder.

            // Let's use a random UUID for the folder if it's new.
            const storageId = listingId || crypto.randomUUID()

            // Upload New Images
            let uploadedPhotos: any[] = []
            if (files.length > 0) {
                // Note: uploadListingImages uses client supabase.
                uploadedPhotos = await uploadListingImages(files, storageId)
            }

            const finalPhotos = [...existingPhotos, ...uploadedPhotos]

            if (listingId) {
                // Update
                await updateListingAction(listingId, values, finalPhotos)
            } else {
                // Create
                // We need to support passing the ID if we want the storage folder to match, or we just accept they might differ if we don't force it.
                // Actually, if we use `storageId` for storage, we can't easily force the DB row ID to match unless we insert it.
                // But does it matter? The photo URL is full path.
                // Photos array contains full URLs.
                // So it DOES NOT MATTER if the folder name is different from the Listing ID.

                await createListingActionWithRedirect(values, finalPhotos)
            }

            // Toast handled by action? No, actions run on server.
            // We should show toast here.
            toast.success(listingId ? 'Anuncio actualizado' : 'Anuncio publicado')

            // Redirect is handled by the action.

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Error al guardar')
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!listingId) return
        setIsLoading(true)
        try {
            const { deleteListingAction } = await import('@/app/market/actions')
            await deleteListingAction(listingId)
            toast.success('Anuncio eliminado')
        } catch (error: any) {
            console.error('Error deleting listing:', error)
            toast.error('Error al eliminar el anuncio')
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
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t pb-[calc(1rem+env(safe-area-inset-bottom))] z-[60]">
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

            <Dialog open={showStripeInfoDialog} onOpenChange={setShowStripeInfoDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Recibir pagos</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-muted-foreground text-sm">
                            Para poder vender artículos y recibir el dinero, necesitamos que conectes tu cuenta bancaria. Solo te llevará un minuto.
                        </p>
                        <div className="flex justify-end gap-2 text-sm text-foreground bg-muted p-2 rounded">
                            <span>🔒 Tus datos están protegidos por Stripe</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={() => {
                                setShowStripeInfoDialog(false)
                                setShowConnectModal(true)
                            }}
                            className="w-full"
                        >
                            Configurar cuenta bancaria
                        </Button>
                        <Button variant="ghost" onClick={() => setShowStripeInfoDialog(false)} className="w-full">
                            Cancelar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <StripeConnectModal
                open={showConnectModal}
                onOpenChange={setShowConnectModal}
                onExit={async () => {
                    setShowConnectModal(false)
                    setIsLoading(true)
                    // Poll for verification for up to 10 seconds
                    let verified = false
                    for (let i = 0; i < 10; i++) {
                        // Force check with Stripe directly via Edge Function to bypass Webhook latency
                        const { data: status, error } = await supabase.functions.invoke('stripe-status')

                        if (!error && status?.charges_enabled) {
                            verified = true
                            break
                        }
                        await new Promise(r => setTimeout(r, 1000))
                    }
                    setIsLoading(false)

                    if (verified) {
                        toast.success('Cuenta verificada correctamente')
                        // Auto-submit form
                        form.handleSubmit(onSubmit)()
                    } else {
                        toast.error('No se ha podido verificar la cuenta. Inténtalo de nuevo en unos segundos.')
                    }
                }}
            />
        </Form>
    )
}

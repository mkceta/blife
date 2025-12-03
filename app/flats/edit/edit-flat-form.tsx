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
import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog'
import { deleteFlat } from '@/app/messages/actions'

const formSchema = z.object({
    title: z.string().min(10, 'Mínimo 10 caracteres').max(100),
    description: z.string().min(20, 'Describe mejor el piso').max(1500),
    rent: z.preprocess((val) => Number(val), z.number().min(50, 'Mínimo 50€')),
    rooms: z.preprocess((val) => Number(val), z.number().min(0).max(20).optional()),
    baths: z.preprocess((val) => Number(val), z.number().min(0).max(10).optional()),
    area_m2: z.preprocess((val) => Number(val), z.number().min(0).max(500).optional()),
    location_area: z.string().min(3, 'Indica la zona'),
    roommates_current: z.preprocess((val) => Number(val), z.number().min(0).max(20).optional()),
})

interface EditFlatFormProps {
    flat: any
}

type FormValues = z.infer<typeof formSchema>

export function EditFlatForm({ flat }: EditFlatFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const router = useRouter()
    const form = useForm<any>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: flat.title,
            description: flat.description || '',
            rent: flat.rent_cents / 100,
            location_area: flat.location_area || '',
            rooms: flat.rooms || 0,
            baths: flat.baths || 0,
            area_m2: flat.area_m2 || 0,
            roommates_current: flat.roommates_current || 0,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        const supabase = createClient()
        try {
            const { error } = await supabase
                .from('flats')
                .update({
                    title: values.title,
                    description: values.description,
                    rent_cents: Math.round(values.rent * 100),
                    rooms: values.rooms,
                    baths: values.baths,
                    area_m2: values.area_m2,
                    location_area: values.location_area,
                    roommates_current: values.roommates_current,
                })
                .eq('id', flat.id)

            if (error) throw error

            toast.success('Piso actualizado')
            router.push(`/flats/${flat.id}`)
            router.refresh()

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Error al actualizar')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center gap-3">
                <Link href={`/flats/${flat.id}`}>
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold">Editar Piso</h1>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6 pb-20">
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
                            name="location_area"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Zona</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Elviña" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="rooms"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Habitaciones</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="3" {...field} value={field.value || ''} onChange={e => field.onChange(e.target.valueAsNumber)} />
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
                                        <Input type="number" placeholder="1" {...field} value={field.value || ''} onChange={e => field.onChange(e.target.valueAsNumber)} />
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
                                        <Input type="number" placeholder="80" {...field} value={field.value || ''} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="roommates_current"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Compañeros actuales</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="2" {...field} value={field.value || ''} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                </FormControl>
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

                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            'Guardar Cambios'
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="destructive"
                        className="w-full"
                        size="lg"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isLoading}
                    >
                        Eliminar Piso
                    </Button>
                </form>
            </Form>

            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title={flat.title}
                itemType="piso"
                onConfirm={() => deleteFlat(flat.id)}
            />
        </>
    )
}

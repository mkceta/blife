'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { ImageUpload } from '@/components/ui/image-upload'
import { uploadPostImage } from '@/lib/upload'
import { createPostAction } from '@/app/community/actions'

const CATEGORIES = [
    { id: 'General', label: 'General' },
    { id: 'Peticiones', label: 'Peticiones' },
    { id: 'Fiesta', label: 'Fiesta' },
    { id: 'Deporte', label: 'Deporte' },
    { id: 'Eventos', label: 'Eventos' },
    { id: 'Entradas', label: 'Entradas' },
    { id: 'Offtopic', label: 'Offtopic' },
]

const formSchema = z.object({
    text: z.string().min(10, 'Mínimo 10 caracteres').max(500, 'Máximo 500 caracteres'),
    categories: z.array(z.string()).min(1, 'Selecciona al menos una categoría'),
})

export default function NewPostPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            text: '',
            categories: ['General'],
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
        setIsLoading(true)
        const supabase = createClient()
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            let photoUrl = undefined
            if (files.length > 0) {
                // We use a temporary ID for the upload path if we don't have the post ID yet.
                // Ideally we'd prefer the ID, but for now we'll use a random UUID which effectively organizes it.
                // Alternatively we could create the post first? But that risks empty post if upload fails.
                // Better to upload first.
                const tempId = crypto.randomUUID()
                photoUrl = await uploadPostImage(files[0], tempId)
            }

            await createPostAction(values.text, values.categories, photoUrl)

            toast.success('Post publicado')
            // Redirect handled by action, but we can also push if we want to be sure client side
            // Action calls redirect() which throws NEXT_REDIRECT, so this code might not be reached if successful.
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Error al publicar')
            setIsLoading(false)
        }
    }

    const toggleCategory = (catId: string, current: string[], onChange: (val: string[]) => void) => {
        if (catId === 'General') {
            // Optional logic: keep General or not. User said "se puede quitar".
        }

        if (current.includes(catId)) {
            const newVal = current.filter(c => c !== catId)
            onChange(newVal)
        } else {
            onChange([...current, catId])
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="sticky top-0 z-10 bg-background border-b border-border p-4 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center gap-3">
                <Link href="/community">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold">Nueva Publicación</h1>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6 pb-24">
                    <FormField
                        control={form.control}
                        name="categories"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categorías</FormLabel>
                                <FormControl>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.map((cat) => (
                                            <Button
                                                key={cat.id}
                                                type="button"
                                                variant={field.value.includes(cat.id) ? "default" : "outline"}
                                                size="sm"
                                                className={`rounded-full ${field.value.includes(cat.id) ? 'shadow-md shadow-primary/20' : ''}`}
                                                onClick={() => toggleCategory(cat.id, field.value, field.onChange)}
                                            >
                                                {cat.label}
                                            </Button>
                                        ))}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="text"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>¿Qué quieres compartir?</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Comparte algo con la comunidad UDC..."
                                        className="min-h-[150px] text-base resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-4">
                        <FormLabel>Foto (Opcional)</FormLabel>
                        <ImageUpload
                            value={files}
                            onChange={handleFilesChange}
                            onRemove={removeFile}
                            maxFiles={1}
                        />
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Publicando...
                            </>
                        ) : (
                            'Publicar'
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    )
}

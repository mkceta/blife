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
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            text: '',
            categories: ['General'],
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        const supabase = createClient()
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            const { error } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    text: values.text,
                    category: values.categories, // Array of strings
                })

            if (error) throw error

            toast.success('Post publicado')
            router.push('/community')
            router.refresh()

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Error al publicar')
        } finally {
            setIsLoading(false)
        }
    }

    const toggleCategory = (catId: string, current: string[], onChange: (val: string[]) => void) => {
        if (catId === 'General') {
            // General is always on? No, user said "General va incluída por defecto (se puede quitar)"
            // So standard toggle.
        }

        if (current.includes(catId)) {
            const newVal = current.filter(c => c !== catId)
            // Prevent empty? User didn't say prevent empty explicitly, but form defaults to General.
            // Schema min(1) prevents empty submission.
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6">
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
                                        className="min-h-[200px] text-base resize-none"
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

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

const formSchema = z.object({
    text: z.string().min(10, 'Mínimo 10 caracteres').max(500, 'Máximo 500 caracteres'),
})

export default function NewPostPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            text: '',
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
                        name="text"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>¿Qué quieres compartir?</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Comparte algo con la comunidad UDC..."
                                        className="min-h-[200px] text-base"
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

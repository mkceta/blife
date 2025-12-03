'use client'

import { use, useState, useEffect } from 'react'
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

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [isLoading, setIsLoading] = useState(false)
    const [post, setPost] = useState<any>(null)
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            text: '',
        },
    })

    useEffect(() => {
        const supabase = createClient()
        async function loadPost() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }

            const { data: postData } = await supabase
                .from('posts')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single()

            if (!postData) {
                toast.error('Post no encontrado o no tienes permiso')
                router.push('/profile')
                return
            }

            setPost(postData)
            form.reset({
                text: postData.text || '',
            })
        }
        loadPost()
    }, [id])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!post) return

        setIsLoading(true)
        const supabase = createClient()
        try {
            const { error } = await supabase
                .from('posts')
                .update({
                    text: values.text,
                })
                .eq('id', post.id)

            if (error) throw error

            toast.success('Post actualizado')
            router.push('/profile')
            router.refresh()

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Error al actualizar')
        } finally {
            setIsLoading(false)
        }
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center gap-3">
                <Link href="/profile">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold">Editar Publicación</h1>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6">
                    <FormField
                        control={form.control}
                        name="text"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Texto</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Edita tu publicación..."
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
                                Guardando...
                            </>
                        ) : (
                            'Guardar Cambios'
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    )
}

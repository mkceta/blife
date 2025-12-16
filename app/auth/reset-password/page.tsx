'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { AnimatedBackground } from '@/components/ui/animated-background'

const formSchema = z.object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
})

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isValid, setIsValid] = useState(true)
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    })

    useEffect(() => {
        // Verify that we have a valid session
        const checkSession = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                toast.error('Enlace inválido o expirado')
                router.push('/auth/forgot-password?error=invalid_link')
                setIsValid(false)
            }
        }
        checkSession()
    }, [router])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        const supabase = createClient()

        const { error } = await supabase.auth.updateUser({
            password: values.password,
        })

        if (error) {
            toast.error(error.message)
            setIsLoading(false)
            return
        }

        toast.success('Contraseña actualizada correctamente')
        router.push('/auth/login')
    }

    if (!isValid) {
        return (
            <>
                <AnimatedBackground
                    colors={{
                        primary: 'from-purple-500/10',
                        secondary: 'via-fuchsia-500/10',
                        tertiary: 'to-pink-500/10'
                    }}
                />

                <Card className="border-white/20 backdrop-blur-sm bg-card/50">
                    <div className="flex justify-center pt-8 pb-4">
                        <Image
                            src="/BLife.webp"
                            alt="BLife Logo"
                            width={140}
                            height={140}
                            priority
                            className="object-contain"
                        />
                    </div>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Verificando...</CardTitle>
                        <CardDescription className="text-center">Comprobando el enlace de recuperación</CardDescription>
                    </CardHeader>
                </Card>
            </>
        )
    }

    return (
        <>
            <AnimatedBackground
                colors={{
                    primary: 'from-purple-500/10',
                    secondary: 'via-fuchsia-500/10',
                    tertiary: 'to-pink-500/10'
                }}
            />

            <Card className="border-white/20 backdrop-blur-sm bg-card/50 w-full max-w-md mx-auto shadow-xl">
                <div className="flex justify-center pt-10 pb-2">
                    <Image
                        src="/BLife.webp"
                        alt="BLife Logo"
                        width={150}
                        height={150}
                        priority
                        className="object-contain"
                    />
                </div>
                <CardHeader className="space-y-2 px-8 pt-0 pb-6">
                    <CardTitle className="text-3xl text-center font-bold tracking-tight">Nueva Contraseña</CardTitle>
                    <CardDescription className="text-center text-base">Introduce tu nueva contraseña</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base">Nueva Contraseña</FormLabel>
                                        <FormControl>
                                            <Input className="border-white/30 h-11" type="password" placeholder="Mínimo 6 caracteres" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base">Confirmar Contraseña</FormLabel>
                                        <FormControl>
                                            <Input className="border-white/30 h-11" type="password" placeholder="Repite la contraseña" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full h-11 text-base font-medium transition-all hover:scale-[1.02]" disabled={isLoading}>
                                {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    )
}




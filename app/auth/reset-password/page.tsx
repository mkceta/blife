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
    const [isValid, setIsValid] = useState<boolean | null>(null) // null = checking
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    })

    useEffect(() => {
        const supabase = createClient()
        let isMounted = true

        // Listen for PASSWORD_RECOVERY event (triggered when Supabase processes the hash)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: unknown) => {
            console.log('[Reset Password] Auth state change:', event)

            if (!isMounted) return

            if (event === 'PASSWORD_RECOVERY') {
                console.log('[Reset Password] PASSWORD_RECOVERY event received!')
                setIsValid(true)
            } else if (event === 'SIGNED_IN' && session) {
                // Might also get SIGNED_IN during recovery
                console.log('[Reset Password] SIGNED_IN event received')
                setIsValid(true)
            }
        })

        // Also check for existing session (in case event was already processed)
        const checkSession = async () => {
            // Give SDK time to process any hash fragment
            await new Promise(resolve => setTimeout(resolve, 500))

            if (!isMounted) return

            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
                console.log('[Reset Password] Session found!')
                setIsValid(true)
                return
            }

            // If there's a hash, wait a bit more for SDK to process
            if (typeof window !== 'undefined' && window.location.hash) {
                console.log('[Reset Password] Hash present, waiting for SDK...')
                await new Promise(resolve => setTimeout(resolve, 1000))

                const { data: { session: retrySession } } = await supabase.auth.getSession()
                if (retrySession) {
                    setIsValid(true)
                    return
                }
            }

            // Still no session - invalid link
            if (isMounted && isValid === null) {
                console.log('[Reset Password] No session found, invalid link')
                toast.error('Enlace inválido o expirado. Solicita uno nuevo.')
                router.push('/auth/forgot-password?error=invalid_link')
                setIsValid(false)
            }
        }

        checkSession()

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [router, isValid])

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

    // Still checking session
    if (isValid === null) {
        return (
            <>
                <AnimatedBackground
                    colors={{
                        primary: 'from-purple-500/10',
                        secondary: 'via-fuchsia-500/10',
                        tertiary: 'to-pink-500/10'
                    }}
                />

                <Card className="border-white/20 backdrop-blur-sm bg-card/50 w-full max-w-md mx-auto">
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
                        <div className="flex justify-center mb-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                        <CardTitle className="text-2xl text-center">Verificando...</CardTitle>
                        <CardDescription className="text-center">Comprobando el enlace de recuperación</CardDescription>
                    </CardHeader>
                </Card>
            </>
        )
    }

    // Invalid session - will redirect
    if (isValid === false) {
        return (
            <>
                <AnimatedBackground
                    colors={{
                        primary: 'from-red-500/10',
                        secondary: 'via-orange-500/10',
                        tertiary: 'to-yellow-500/10'
                    }}
                />

                <Card className="border-white/20 backdrop-blur-sm bg-card/50 w-full max-w-md mx-auto">
                    <CardHeader className="space-y-1 pt-8">
                        <CardTitle className="text-2xl text-center text-destructive">Enlace Inválido</CardTitle>
                        <CardDescription className="text-center">Redirigiendo...</CardDescription>
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




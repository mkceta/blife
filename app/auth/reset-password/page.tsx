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
import { Eye, EyeOff } from 'lucide-react'

const formSchema = z.object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
})

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isChecking, setIsChecking] = useState(true)
    const [hasSession, setHasSession] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    })

    useEffect(() => {
        // Check if user has a valid session (should have been set by callback)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
                console.log('[Reset Password] Session found, showing form')
                setHasSession(true)
                setIsChecking(false)
            } else {
                console.log('[Reset Password] No session found')
                toast.error('Enlace inválido o expirado. Solicita uno nuevo.')
                router.push('/auth/forgot-password?error=invalid_link')
            }
        }

        // Small delay to ensure session is fully established after redirect
        const timer = setTimeout(checkSession, 300)
        return () => clearTimeout(timer)
    }, [router, supabase.auth])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)

        const { error } = await supabase.auth.updateUser({
            password: values.password,
        })

        if (error) {
            toast.error(error.message)
            setIsLoading(false)
            return
        }

        toast.success('Contraseña actualizada correctamente')

        // Sign out and redirect to login
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    // Loading state while checking session
    if (isChecking) {
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

    // Only show form if we have a valid session
    if (!hasSession) {
        return null // Will redirect via useEffect
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
                                            <div className="relative">
                                                <Input className="border-white/30 h-11 pr-10" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" {...field} />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
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
                                            <div className="relative">
                                                <Input className="border-white/30 h-11 pr-10" type={showConfirmPassword ? "text" : "password"} placeholder="Repite la contraseña" {...field} />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
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

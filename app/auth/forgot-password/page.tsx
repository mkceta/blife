'use client'

import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { AnimatedBackground } from '@/components/ui/animated-background'
import { useSearchParams } from 'next/navigation'

const formSchema = z.object({
    email: z.string().email().refine((val) => val.endsWith('@udc.es') || val.endsWith('@udc.gal'), {
        message: 'Solo se permiten correos @udc.es o @udc.gal',
    }),
})

function ForgotPasswordContent() {
    const [isLoading, setIsLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [sentToEmail, setSentToEmail] = useState('')
    const searchParams = useSearchParams()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
        },
    })

    // Show error if redirected from expired link
    useEffect(() => {
        const error = searchParams.get('error')
        if (error === 'expired') {
            toast.error('El enlace ha caducado. Solicita uno nuevo.', {
                duration: 5000,
            })
        } else if (error === 'invalid_link') {
            toast.error('El enlace no es válido. Solicita uno nuevo.', {
                duration: 5000,
            })
        }
    }, [searchParams])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        const supabase = createClient()

        const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
            // Use server-side route for PKCE code exchange
            // The code_verifier is stored in cookies and must be exchanged server-side
            redirectTo: `${location.origin}/auth/confirm?next=/auth/reset-password`,
        })

        if (error) {
            console.error('Error sending recovery email:', error)
            toast.error(error.message)
            setIsLoading(false)
            return
        }

        setSentToEmail(values.email)
        setEmailSent(true)
        setIsLoading(false)
    }

    if (emailSent) {
        return (
            <>
                <AnimatedBackground
                    colors={{
                        primary: 'from-orange-500/10',
                        secondary: 'via-pink-500/10',
                        tertiary: 'to-rose-500/10'
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
                        <CardTitle className="text-3xl text-center font-bold tracking-tight">Email Enviado</CardTitle>
                        <CardDescription className="text-center text-base">Revisa tu bandeja de entrada</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4 px-8 pb-8">
                        <p className="text-base text-muted-foreground">
                            Correo enviado a <span className="font-semibold text-foreground">{sentToEmail}</span>
                            <br />
                            Revisa tu bandeja de entrada y sigue las instrucciones.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center px-8 pb-8">
                        <Link href="/auth/login">
                            <Button variant="outline" className="gap-2 h-11 px-6">
                                <ArrowLeft className="h-4 w-4" />
                                Volver al login
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </>
        )
    }

    return (
        <>
            <AnimatedBackground
                colors={{
                    primary: 'from-orange-500/10',
                    secondary: 'via-pink-500/10',
                    tertiary: 'to-rose-500/10'
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
                    <CardTitle className="text-3xl text-center font-bold tracking-tight">Recuperar Contraseña</CardTitle>
                    <CardDescription className="text-center text-base">Introduce tu email de la UDC para recibir un enlace de recuperación</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base">Email UDC</FormLabel>
                                        <FormControl>
                                            <Input className="border-white/30 h-11" placeholder="usuario@udc.es" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full h-11 text-base font-medium transition-all hover:scale-[1.02]" disabled={isLoading}>
                                {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center px-8 pb-8">
                    <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 font-medium">
                        <ArrowLeft className="h-4 w-4" />
                        Volver al login
                    </Link>
                </CardFooter>
            </Card>
        </>
    )
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        }>
            <ForgotPasswordContent />
        </Suspense>
    )
}

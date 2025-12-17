'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
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
import { useSearchParams, useRouter } from 'next/navigation'

const emailFormSchema = z.object({
    email: z.string().email().refine((val) => val.endsWith('@udc.es') || val.endsWith('@udc.gal'), {
        message: 'Solo se permiten correos @udc.es o @udc.gal',
    }),
})

function ForgotPasswordContent() {
    const [isLoading, setIsLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [sentToEmail, setSentToEmail] = useState('')
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
    const [isVerifying, setIsVerifying] = useState(false)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const searchParams = useSearchParams()
    const router = useRouter()

    const form = useForm<z.infer<typeof emailFormSchema>>({
        resolver: zodResolver(emailFormSchema),
        defaultValues: {
            email: '',
        },
    })

    // Show error if redirected from expired link
    useEffect(() => {
        const error = searchParams.get('error')
        if (error === 'expired') {
            toast.error('El código ha caducado. Solicita uno nuevo.', {
                duration: 5000,
            })
        } else if (error === 'invalid_link' || error === 'invalid_code') {
            toast.error('El código no es válido. Solicita uno nuevo.', {
                duration: 5000,
            })
        }
    }, [searchParams])

    async function onSubmitEmail(values: z.infer<typeof emailFormSchema>) {
        setIsLoading(true)
        const supabase = createClient()

        // Use resetPasswordForEmail - this uses the "Reset Password" email template
        const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
            // Don't use redirectTo - we want the user to use the OTP code instead
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
        toast.success(`Código enviado a ${values.email}`)
    }

    const handleOtpChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return

        const newOtp = [...otpCode]
        newOtp[index] = value
        setOtpCode(newOtp)

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (pastedData.length === 6) {
            const newOtp = pastedData.split('')
            setOtpCode(newOtp)
            inputRefs.current[5]?.focus()
        }
    }

    async function verifyOtp() {
        const code = otpCode.join('')
        if (code.length !== 6) {
            toast.error('Introduce el código de 6 dígitos')
            return
        }

        setIsVerifying(true)
        const supabase = createClient()

        // Use 'recovery' type for password reset OTP
        const { error } = await supabase.auth.verifyOtp({
            email: sentToEmail,
            token: code,
            type: 'recovery',
        })

        if (error) {
            console.error('Error verifying OTP:', error)
            if (error.message.includes('expired')) {
                toast.error('El código ha caducado. Solicita uno nuevo.')
            } else {
                toast.error('Código incorrecto. Inténtalo de nuevo.')
            }
            setIsVerifying(false)
            return
        }

        toast.success('Código verificado correctamente')
        router.push('/auth/reset-password')
    }

    async function resendCode() {
        setIsLoading(true)
        const supabase = createClient()

        const { error } = await supabase.auth.resetPasswordForEmail(sentToEmail)

        if (error) {
            console.error('Error resending code:', error)
            toast.error(error.message)
        } else {
            toast.success('Nuevo código enviado')
            setOtpCode(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        }
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
                    <CardHeader className="space-y-2 px-8 pt-0 pb-4">
                        <CardTitle className="text-3xl text-center font-bold tracking-tight">Introduce el código</CardTitle>
                        <CardDescription className="text-center text-base">
                            Código enviado a <span className="font-semibold text-foreground">{sentToEmail}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-6">
                        {/* OTP Input */}
                        <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                            {otpCode.map((digit, index) => (
                                <Input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-2xl font-bold border-white/30"
                                    disabled={isVerifying}
                                />
                            ))}
                        </div>

                        <Button
                            onClick={verifyOtp}
                            className="w-full h-11 text-base font-medium transition-all hover:scale-[1.02]"
                            disabled={isVerifying || otpCode.join('').length !== 6}
                        >
                            {isVerifying ? 'Verificando...' : 'Verificar código'}
                        </Button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={resendCode}
                                disabled={isLoading}
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                {isLoading ? 'Enviando...' : '¿No recibiste el código? Reenviar'}
                            </button>
                        </div>
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
                    <CardDescription className="text-center text-base">Te enviaremos un código de 6 dígitos a tu email</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmitEmail)} className="space-y-6">
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
                                {isLoading ? 'Enviando...' : 'Enviar código'}
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

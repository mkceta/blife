'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AnimatedBackground } from '@/components/ui/animated-background'

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
        })

        if (error) {
            toast.error(error.message)
            setIsLoading(false)
            return
        }

        toast.success('Sesión iniciada')
        router.push('/market')
        router.refresh()
    }

    return (
        <>
            <AnimatedBackground
                colors={{
                    primary: 'from-blue-500/10',
                    secondary: 'via-purple-500/10',
                    tertiary: 'to-primary/10'
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
                    <CardTitle className="text-3xl text-center font-bold tracking-tight">Iniciar Sesión</CardTitle>
                    <CardDescription className="text-center text-base">Entra con tu correo institucional para continuar</CardDescription>
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
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-base">Contraseña</FormLabel>
                                            <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline font-medium">
                                                ¿Olvidaste tu contraseña?
                                            </Link>
                                        </div>
                                        <FormControl>
                                            <Input className="border-white/30 h-11" type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full h-11 text-base font-medium transition-all hover:scale-[1.02]" disabled={isLoading}>
                                {isLoading ? 'Entrando...' : 'Entrar'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center px-8 pb-8">
                    <p className="text-sm text-muted-foreground">
                        ¿No tienes cuenta?{' '}
                        <Link href="/auth/register" className="text-primary hover:underline font-medium">
                            Regístrate
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </>
    )
}




'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatedBackground } from '@/components/ui/animated-background'
import { AlertTriangle } from 'lucide-react'

export default function AuthCodeErrorPage() {
    return (
        <>
            <AnimatedBackground
                colors={{
                    primary: 'from-red-500/10',
                    secondary: 'via-orange-500/10',
                    tertiary: 'to-yellow-500/10'
                }}
            />

            <Card className="border-white/20 backdrop-blur-sm bg-card/50 w-full max-w-md mx-auto shadow-xl">
                <div className="flex justify-center pt-10 pb-2">
                    <Image
                        src="/BLife.webp"
                        alt="BLife Logo"
                        width={120}
                        height={120}
                        priority
                        className="object-contain opacity-50"
                    />
                </div>
                <CardHeader className="space-y-2 px-8 pt-0 pb-4">
                    <div className="flex justify-center mb-2">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl text-center font-bold tracking-tight">
                        Error de Verificación
                    </CardTitle>
                    <CardDescription className="text-center text-base">
                        No hemos podido verificar tu enlace
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-8 pb-4">
                    <div className="text-sm text-muted-foreground text-center space-y-2">
                        <p>Esto puede ocurrir porque:</p>
                        <ul className="list-disc list-inside text-left space-y-1">
                            <li>El enlace ha caducado (expiran en 1 hora)</li>
                            <li>El enlace ya fue utilizado</li>
                            <li>El enlace está incompleto o corrupto</li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 px-8 pb-8">
                    <Button asChild className="w-full h-11">
                        <Link href="/auth/forgot-password">
                            Solicitar nuevo enlace
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full h-11">
                        <Link href="/auth/login">
                            Volver al login
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </>
    )
}

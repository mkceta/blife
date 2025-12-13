
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight, ShoppingBag, Home, MessageCircle, Users, Smartphone } from 'lucide-react'
import { ThemeProvider } from 'next-themes'

export default function LandingPage() {
    return (
        // Force dark theme look for the landing page
        // overflow-x-hidden prevents horizontal scroll
        <div className="dark min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 selection:text-white">

            {/* Background Gradients & Floating Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full opacity-50 animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1s' }} />

                {/* Floating decorative elements */}
                <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-purple-500/30 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-blue-500/30 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }} />
            </div>

            {/* Navbar */}
            <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-3xl font-bold tracking-tight text-primary" style={{ fontFamily: 'var(--font-open-sans)' }}>BLife</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/auth/login">
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                            Iniciar Sesión
                        </Button>
                    </Link>
                    <Link href="/market">
                        <Button className="font-semibold shadow-glow-primary hover:scale-105 transition-transform">
                            Entrar a la App
                        </Button>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 pt-12 pb-24 lg:pt-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">

                {/* Text Content */}
                <div className="flex-1 text-center lg:text-left space-y-8 max-w-2xl mx-auto lg:mx-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >


                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
                            Tu vida universitaria, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-blue-500 animate-gradient-x">
                                Subida de nivel.
                            </span>
                        </h1>

                        <p className="text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                            Compra y vende libros, encuentra el piso perfecto, chatea con compañeros y no te pierdas ni una fiesta. Todo BLife en tu bolsillo.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                    >
                        <Link href="/market" className="w-full sm:w-auto">
                            <Button size="lg" className="h-14 px-8 w-full sm:w-auto text-lg rounded-full shadow-glow-primary hover:scale-105 transition-transform gap-2 bg-white text-black hover:bg-white/90">
                                Ir a BLife Web
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>

                        <a href="#" className="w-full sm:w-auto group">
                            <Button size="lg" variant="outline" className="h-14 px-8 w-full sm:w-auto text-lg rounded-full border-white/20 bg-black/40 backdrop-blur-sm hover:bg-black/60 gap-3 group-hover:border-primary/50 transition-colors">
                                <Smartphone className="h-5 w-5 group-hover:text-primary transition-colors" />
                                <span>Descargar App</span>
                            </Button>
                        </a>
                    </motion.div>

                    {/* Feature Pills */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="pt-8 flex flex-wrap justify-center lg:justify-start gap-3"
                    >
                        {[
                            { icon: ShoppingBag, label: "Mercadillo" },
                            { icon: Home, label: "Pisos" },
                            { icon: MessageCircle, label: "Chat" },
                            { icon: Users, label: "Comunidad" },
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/30 border border-white/5 backdrop-blur-sm">
                                <feature.icon className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">{feature.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Hero Visuals / Mockups */}
                <div className="flex-1 relative w-full max-w-[500px] lg:max-w-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.6, type: "spring" }}
                        className="relative z-10"
                    >
                        {/* Phone Mockup Container */}
                        <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl overflow-hidden ring-4 ring-white/10">
                            <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
                            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                            <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>

                            {/* Screen Content - Placeholder for User Upload */}
                            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-background relative flex flex-col">
                                {/* Status Bar */}
                                <div className="h-8 w-full bg-background flex items-center justify-between px-6 py-2 z-20">
                                    <span className="text-[10px] font-bold">14:27</span>
                                    <div className="flex gap-1">
                                        <div className="h-2 w-2 rounded-full bg-foreground"></div>
                                        <div className="h-2 w-2 rounded-full bg-foreground"></div>
                                    </div>
                                </div>

                                {/* App UI Simulation */}
                                <div className="flex-1 p-4 space-y-4">
                                    {/* App Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="h-8 w-24 bg-muted/50 rounded-md animate-pulse"></div>
                                        <div className="h-8 w-8 bg-muted/50 rounded-full animate-pulse"></div>
                                    </div>

                                    {/* Stories / Highlights */}
                                    <div className="flex gap-2 overflow-hidden">
                                        <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-yellow-400 to-primary p-[2px]">
                                            <div className="h-full w-full rounded-full bg-background border-2 border-background" />
                                        </div>
                                        <div className="h-16 w-16 rounded-full bg-muted/50 animate-pulse"></div>
                                        <div className="h-16 w-16 rounded-full bg-muted/50 animate-pulse"></div>
                                    </div>

                                    {/* Feed Item 1 */}
                                    <div className="space-y-2">
                                        <div className="h-40 w-full bg-muted/30 rounded-xl relative overflow-hidden group">
                                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 font-medium text-sm">
                                                Captura App Aquí
                                            </div>
                                        </div>
                                        <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse"></div>
                                        <div className="h-4 w-1/2 bg-muted/50 rounded animate-pulse"></div>
                                    </div>

                                    {/* Bottom Nav Placeholder */}
                                    <div className="absolute bottom-4 left-4 right-4 h-14 bg-card/80 backdrop-blur-md rounded-2xl flex items-center justify-around border border-white/5 shadow-2xl">
                                        <div className="h-6 w-6 bg-primary/20 rounded-md"></div>
                                        <div className="h-6 w-6 bg-muted/40 rounded-md"></div>
                                        <div className="h-6 w-6 bg-muted/40 rounded-md"></div>
                                        <div className="h-6 w-6 bg-muted/40 rounded-md"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Second Phone (Tilted behind) */}
                        <div className="absolute top-12 -right-16 -z-10 border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[550px] w-[280px] opacity-40 blur-[1px] rotate-12 scale-95 hidden lg:block">
                            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-background/50" />
                        </div>
                    </motion.div>
                </div>

            </main>

        </div>
    )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShoppingBag, Home, MessageCircle, Users } from 'lucide-react'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white">

            {/* Desktop Version */}
            <div className="hidden md:block">
                {/* Simple gradient background */}
                <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />

                <div className="relative z-10">
                    {/* Navbar */}
                    <nav className="flex items-center justify-between px-12 py-6">
                        <h1 className="text-3xl font-bold">BLife</h1>
                        <div className="flex gap-4">
                            <Link href="/auth/login">
                                <Button variant="ghost" className="text-gray-400 hover:text-white">
                                    Iniciar sesión
                                </Button>
                            </Link>
                            <Link href="/auth/register">
                                <Button className="bg-white text-black hover:bg-gray-200">
                                    Registrarse
                                </Button>
                            </Link>
                        </div>
                    </nav>

                    {/* Hero Section */}
                    <div className="max-w-7xl mx-auto px-12 py-20">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">

                            {/* Left - Text */}
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h2 className="text-6xl font-bold leading-tight">
                                        Tu vida universitaria
                                        <br />
                                        <span className="text-purple-400">en una app</span>
                                    </h2>
                                    <p className="text-xl text-gray-400">
                                        Compra, vende, encuentra piso y conecta con otros estudiantes de la UDC.
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <Link href="/auth/register">
                                        <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
                                            Empezar ahora
                                            <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                    </Link>
                                    <Link href="/market">
                                        <Button size="lg" variant="outline" className="border-gray-700 text-white hover:bg-gray-900">
                                            Ver demo
                                        </Button>
                                    </Link>
                                </div>

                                {/* Features */}
                                <div className="grid grid-cols-2 gap-4 pt-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-600/20 rounded-lg">
                                            <ShoppingBag className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <span>Mercadillo</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-600/20 rounded-lg">
                                            <Home className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <span>Pisos</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-600/20 rounded-lg">
                                            <MessageCircle className="w-5 h-5 text-green-400" />
                                        </div>
                                        <span>Chat</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-600/20 rounded-lg">
                                            <Users className="w-5 h-5 text-orange-400" />
                                        </div>
                                        <span>Comunidad</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right - Instagram-style Stacked Photos */}
                            <div className="relative h-[600px] flex items-center justify-center">

                                {/* Floating Reaction Emojis */}
                                <div className="absolute -top-12 left-1/4 bg-white rounded-full p-3 shadow-2xl">
                                    <div className="flex gap-1">
                                        <span className="text-2xl">🔥</span>
                                        <span className="text-2xl">👍</span>
                                        <span className="text-2xl">💜</span>
                                    </div>
                                </div>

                                <div className="absolute top-1/3 -left-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full p-4 shadow-2xl">
                                    <div className="flex items-center gap-1 text-white">
                                        <span className="text-xl">⭐</span>
                                    </div>
                                </div>

                                <div className="absolute bottom-1/4 -left-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-full w-16 h-16 flex items-center justify-center shadow-2xl">
                                    <span className="text-3xl">❤️</span>
                                </div>

                                <div className="absolute top-1/2 -right-12 rounded-full p-1 shadow-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                        <span className="text-xl">♻️</span>
                                    </div>
                                </div>

                                {/* Stacked Photos - Only 3 */}
                                <div className="relative w-[350px] h-[450px]">

                                    {/* Photo 3 - Back right (smaller, half visible) */}
                                    <div
                                        className="absolute w-[200px] h-[280px] rounded-3xl shadow-2xl overflow-hidden"
                                        style={{
                                            transform: 'rotate(12deg) translateX(150px) translateY(80px)',
                                            zIndex: 1
                                        }}
                                    >
                                        <img
                                            src="/student_books.png"
                                            alt="Students studying"
                                            className="w-full h-full object-cover"
                                            style={{ filter: 'brightness(0.9)' }}
                                        />
                                    </div>

                                    {/* Photo 2 - Back left (smaller, half visible) */}
                                    <div
                                        className="absolute w-[200px] h-[280px] rounded-3xl shadow-2xl overflow-hidden"
                                        style={{
                                            transform: 'rotate(-15deg) translateX(-100px) translateY(60px)',
                                            zIndex: 2
                                        }}
                                    >
                                        <img
                                            src="/student_apartment.png"
                                            alt="Student apartment"
                                            className="w-full h-full object-cover"
                                            style={{ filter: 'brightness(0.9)' }}
                                        />
                                    </div>

                                    {/* Photo 1 - Front center (full size) */}
                                    <div
                                        className="absolute w-[300px] h-[400px] rounded-3xl shadow-2xl overflow-hidden hover:scale-105 transition-transform cursor-pointer"
                                        style={{
                                            transform: 'rotate(2deg) translateX(25px)',
                                            zIndex: 3
                                        }}
                                    >
                                        <img
                                            src="/student_party.png"
                                            alt="Students at party"
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Instagram-style bottom bar */}
                                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                                    <span className="text-xl">💬</span>
                                                </div>
                                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                                    <span className="text-xl">❤️</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Version - Scrollable */}
            <div className="md:hidden min-h-screen">
                {/* Navbar */}
                <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <h1 className="text-2xl font-bold">BLife</h1>
                    <Link href="/auth/login">
                        <Button variant="ghost" size="sm" className="text-gray-400">
                            Entrar
                        </Button>
                    </Link>
                </nav>

                {/* Hero */}
                <div className="px-6 py-12 space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-4xl font-bold leading-tight">
                            Tu vida universitaria
                            <br />
                            <span className="text-purple-400">en una app</span>
                        </h2>
                        <p className="text-lg text-gray-400">
                            Todo lo que necesitas como estudiante de la UDC en un solo lugar.
                        </p>
                    </div>

                    {/* Stacked Photos - Mobile */}
                    <div className="relative h-[500px] flex items-center justify-center">

                        {/* Floating Reactions */}
                        <div className="absolute -top-8 left-1/4 bg-white rounded-full p-2 shadow-xl">
                            <div className="flex gap-1">
                                <span className="text-lg">🔥</span>
                                <span className="text-lg">💜</span>
                            </div>
                        </div>

                        <div className="absolute top-1/4 -left-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-full w-12 h-12 flex items-center justify-center shadow-xl">
                            <span className="text-2xl">❤️</span>
                        </div>

                        <div className="absolute top-1/2 -right-8 rounded-full p-1 shadow-xl bg-gradient-to-r from-purple-500 to-pink-500">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                                <span className="text-lg">👤</span>
                            </div>
                        </div>

                        {/* Stacked Photos */}
                        <div className="relative w-[280px] h-[360px]">

                            {/* Photo 3 - Back (smaller, half visible) */}
                            <div
                                className="absolute w-[160px] h-[220px] rounded-3xl shadow-xl overflow-hidden"
                                style={{
                                    transform: 'rotate(12deg) translateX(120px) translateY(60px)',
                                    zIndex: 1
                                }}
                            >
                                <img
                                    src="/api/placeholder/160/220"
                                    alt="Students studying"
                                    className="w-full h-full object-cover"
                                    style={{ filter: 'brightness(0.9)' }}
                                />
                            </div>

                            {/* Photo 2 - Back left (smaller, half visible) */}
                            <div
                                className="absolute w-[160px] h-[220px] rounded-3xl shadow-xl overflow-hidden"
                                style={{
                                    transform: 'rotate(-12deg) translateX(-80px) translateY(50px)',
                                    zIndex: 2
                                }}
                            >
                                <img
                                    src="/api/placeholder/160/220"
                                    alt="Student apartment"
                                    className="w-full h-full object-cover"
                                    style={{ filter: 'brightness(0.9)' }}
                                />
                            </div>

                            {/* Photo 1 - Front */}
                            <div
                                className="absolute w-[240px] h-[320px] rounded-3xl shadow-xl overflow-hidden"
                                style={{
                                    transform: 'rotate(2deg) translateX(20px)',
                                    zIndex: 3
                                }}
                            >
                                <img
                                    src="/api/placeholder/240/320"
                                    alt="Students at party"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                        </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">¿Qué puedes hacer?</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-xl">
                                <div className="p-2 bg-purple-600/20 rounded-lg">
                                    <ShoppingBag className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="font-medium">Mercadillo</p>
                                    <p className="text-sm text-gray-400">Compra y vende libros, apuntes...</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-xl">
                                <div className="p-2 bg-blue-600/20 rounded-lg">
                                    <Home className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-medium">Pisos</p>
                                    <p className="text-sm text-gray-400">Encuentra tu piso ideal</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-xl">
                                <div className="p-2 bg-green-600/20 rounded-lg">
                                    <MessageCircle className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="font-medium">Chat</p>
                                    <p className="text-sm text-gray-400">Habla con otros estudiantes</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-xl">
                                <div className="p-2 bg-orange-600/20 rounded-lg">
                                    <Users className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <p className="font-medium">Comunidad</p>
                                    <p className="text-sm text-gray-400">Comparte y descubre eventos</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="space-y-3 pb-8">
                        <Link href="/auth/register" className="block">
                            <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700">
                                Crear cuenta gratis
                            </Button>
                        </Link>
                        <Link href="/auth/login" className="block">
                            <Button size="lg" variant="outline" className="w-full border-gray-700">
                                Ya tengo cuenta
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

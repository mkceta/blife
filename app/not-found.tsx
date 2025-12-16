'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SnakeGame } from '@/components/shared/snake-game'

interface Particle {
    id: number
    x: number
    y: number
    size: number
    duration: number
}

export default function NotFound() {
    const [clickCount, setClickCount] = useState(0)
    const [foundEasterEgg, setFoundEasterEgg] = useState(false)
    const [showSnake, setShowSnake] = useState(false)
    const [particles, setParticles] = useState<Particle[]>([])
    const router = useRouter()

    // Generate particles only on client to avoid hydration mismatch
    useEffect(() => {
        const newParticles: Particle[] = [...Array(20)].map((_, i) => ({
            id: i,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 4 + 1,
            duration: Math.random() * 10 + 10,
        }))
        setParticles(newParticles)
    }, [])

    const handleGlitch = () => {
        const newCount = clickCount + 1
        setClickCount(newCount)

        // Trigger on 3 clicks as requested
        if (newCount === 3) {
            setFoundEasterEgg(true)
            setTimeout(() => setShowSnake(true), 1500) // Delay to show "System Breach" first
        }
    }

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white relative overflow-hidden p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]">

            {/* Background Stars - Client-only to avoid hydration errors */}
            <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        className="absolute bg-white rounded-full"
                        initial={{
                            x: particle.x,
                            y: particle.y,
                            scale: particle.size / 4
                        }}
                        animate={{
                            y: [particle.y, particle.y - 100],
                            opacity: [0.2, 0.8, 0.2]
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{
                            width: particle.size + 'px',
                            height: particle.size + 'px',
                        }}
                    />
                ))}
            </div>

            <div className="z-10 text-center space-y-8 max-w-md">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    onClick={handleGlitch}
                    className="relative cursor-pointer select-none"
                    whileTap={{ scale: 0.95 }}
                >
                    <h1 className="text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">
                        4
                        <span className={`inline-block ${foundEasterEgg ? 'animate-spin text-primary' : ''}`}>0</span>
                        4
                    </h1>
                    {foundEasterEgg && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute -top-12 left-0 right-0 text-primary font-bold tracking-widest uppercase text-sm"
                        >
                            ¡SYSTEM BREACH!
                        </motion.div>
                    )}
                </motion.div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Página no encontrada</h2>
                    <p className="text-gray-400">
                        Parece que te has perdido en el campus virtual.
                        Esta página no existe o ha sido movida a otra dimensión.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
                    <Button variant="default" className="bg-white text-black hover:bg-white/90" onClick={() => router.push('/home')}>
                        <Home className="mr-2 h-4 w-4" />
                        Ir al Inicio
                    </Button>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                </div>
            </div>

            {/* Easter Egg Content using basic HTML/CSS if revealed */}
            {foundEasterEgg && !showSnake && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-10 text-xs text-gray-500 font-mono"
                >
                    Debug: PROTOCOL_GHOST_INITIATED // BLIFE_SYS_OVERRIDE ... LOADING GAME MODULE
                </motion.div>
            )}

            <AnimatePresence>
                {showSnake && <SnakeGame onClose={() => setShowSnake(false)} />}
            </AnimatePresence>
        </div>
    )
}

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, MoveLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SnakeGame } from '@/components/snake-game'

export default function NotFound() {
    const [clickCount, setClickCount] = useState(0)
    const [foundEasterEgg, setFoundEasterEgg] = useState(false)
    const [showSnake, setShowSnake] = useState(false)
    const router = useRouter()

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

            {/* Background Stars - Simple CSS or SVG */}
            <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-white rounded-full"
                        initial={{
                            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                            scale: Math.random() * 0.5 + 0.5
                        }}
                        animate={{
                            y: [null, Math.random() * -100],
                            opacity: [0.2, 0.8, 0.2]
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{
                            width: Math.random() * 4 + 1 + 'px',
                            height: Math.random() * 4 + 1 + 'px',
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
                        <MoveLeft className="mr-2 h-4 w-4" />
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

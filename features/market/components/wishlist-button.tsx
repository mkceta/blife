import { useState, useTransition, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { likeHaptic, unlikeHaptic } from '@/lib/haptics'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'

interface WishlistButtonProps {
    listingId: string
    isFavorited: boolean
    favoritesCount?: number
    currentUserId?: string
    variant?: 'default' | 'icon'
    className?: string
}

const Particle = ({ angle }: { angle: number }) => {
    // Randomize distance and size slightly for natural feel
    const distance = 40 + Math.random() * 20
    const size = 3 + Math.random() * 3

    return (
        <motion.div
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
                x: Math.cos(angle * (Math.PI / 180)) * distance,
                y: Math.sin(angle * (Math.PI / 180)) * distance,
                scale: [0, 1.5, 0], // Pop up and shrink
                opacity: [1, 1, 0]  // Fade out at end
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute rounded-full"
            style={{
                width: size,
                height: size,
                backgroundColor: ['#FF4D4D', '#FF8585', '#FFD700', '#4D96FF', '#6AC5FE'][Math.floor(Math.random() * 5)], // More colors
                left: '50%',
                top: '50%',
                marginLeft: -size / 2,
                marginTop: -size / 2,
            }}
        />
    )
}

export function WishlistButton({
    listingId,
    isFavorited: initialFavorited,
    favoritesCount = 0,
    currentUserId,
    variant = 'icon',
    className
}: WishlistButtonProps) {
    const [isFavorited, setIsFavorited] = useState(initialFavorited)
    const [count, setCount] = useState(favoritesCount)
    const [isPending, startTransition] = useTransition()
    const [showParticles, setShowParticles] = useState(false)
    const controls = useAnimation()
    const supabase = createClient()

    // Reset particles after animation
    useEffect(() => {
        if (showParticles) {
            const timer = setTimeout(() => setShowParticles(false), 800)
            return () => clearTimeout(timer)
        }
        return undefined
    }, [showParticles])

    const handleToggle = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (!currentUserId) {
            toast.error('Inicia sesión para añadir a favoritos')
            return
        }

        // 1. Instant UI Update
        const newState = !isFavorited
        setIsFavorited(newState)
        setCount(prev => newState ? prev + 1 : Math.max(0, prev - 1))

        // 2. Animation & Haptics
        if (newState) {
            likeHaptic() // Emotional "like" pattern: Medium → Light
            setShowParticles(true)
            controls.start({
                scale: [1, 0.8, 1.4, 0.9, 1],
                transition: { duration: 0.5, ease: "easeOut" } // Fixed: Use tween/keyframes instead of spring
            })
        } else {
            unlikeHaptic() // Subtle "unlike" pattern: Light
            controls.start({
                scale: [1, 0.8, 1],
                transition: { duration: 0.2 }
            })
        }

        // 3. Server Request (Optimistic)
        startTransition(async () => {
            try {
                if (newState) {
                    const { error } = await supabase
                        .from('favorites')
                        .insert({
                            user_id: currentUserId,
                            listing_id: listingId
                        })
                    if (error) throw error
                    await supabase.rpc('increment_favorites', { listing_id: listingId })
                } else {
                    const { error } = await supabase
                        .from('favorites')
                        .delete()
                        .eq('user_id', currentUserId)
                        .eq('listing_id', listingId)
                    if (error) throw error
                    await supabase.rpc('decrement_favorites', { listing_id: listingId })
                }
            } catch (error: unknown) {
                console.error('Error toggling favorite:', error)
                toast.error('No se pudo actualizar')
                // Revert UI on error
                setIsFavorited(!newState)
                setCount(prev => !newState ? prev + 1 : Math.max(0, prev - 1))
            }
        })
    }

    if (!currentUserId) return null

    if (variant === 'icon') {
        const particleCount = 20
        const angles = Array.from({ length: particleCount }).map((_, i) => (360 / particleCount) * i)

        return (
            <div className="relative group/btn z-50">
                {/* Particles Container */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <AnimatePresence>
                        {showParticles && angles.map((angle, i) => (
                            <Particle key={i} angle={angle} />
                        ))}
                    </AnimatePresence>
                </div>

                <motion.button
                    onClick={handleToggle}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                        "relative h-9 rounded-full decoration-0 select-none outline-none overflow-visible flex items-center justify-center gap-1.5 transition-all duration-300",
                        "glass-strong backdrop-blur-md border",
                        count > 0 ? "w-auto px-3" : "w-9",
                        isFavorited
                            ? "bg-primary/20 border-primary/50 shadow-[0_0_15px_-3px_rgba(var(--primary),0.6)]" // Glowing effect
                            : "bg-black/40 border-white/10 hover:bg-black/60 hover:border-white/30",
                        className
                    )}
                >
                    <motion.div animate={controls}>
                        <Heart
                            className={cn(
                                "h-5 w-5 transition-colors duration-300",
                                isFavorited
                                    ? "fill-primary text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]"
                                    : "text-white group-hover/btn:text-primary"
                            )}
                        />
                    </motion.div>

                    {count > 0 && (
                        <span className={cn(
                            "text-xs font-bold transition-colors duration-200",
                            isFavorited ? "text-primary shadow-glow-sm" : "text-white"
                        )}>
                            {count}
                        </span>
                    )}
                </motion.button>
            </div>
        )
    }

    return (
        <Button
            variant={isFavorited ? "default" : "outline"}
            onClick={handleToggle}
            className={cn(
                "transition-all duration-300 transform active:scale-95",
                isFavorited && "bg-gradient-primary shadow-glow-primary hover:shadow-glow-lg",
                className
            )}
        >
            <motion.div animate={controls} className="mr-2">
                <Heart className={cn("h-4 w-4 transition-all", isFavorited && "fill-current")} />
            </motion.div>
            {isFavorited ? 'En Wishlist' : 'Añadir a Wishlist'}
        </Button>
    )
}


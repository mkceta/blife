'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedCheckmarkProps {
    /**
     * Size of the checkmark
     */
    size?: 'sm' | 'md' | 'lg' | 'xl'
    /**
     * Color variant
     */
    variant?: 'success' | 'primary' | 'white'
    /**
     * Show the checkmark
     */
    show?: boolean
    /**
     * Duration of the animation in seconds
     */
    duration?: number
    /**
     * Additional className
     */
    className?: string
    /**
     * Callback when animation completes
     */
    onComplete?: () => void
}

const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
}

const iconSizeMap = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
}

const colorMap = {
    success: 'bg-green-500 text-white',
    primary: 'bg-primary text-primary-foreground',
    white: 'bg-white text-green-500'
}

/**
 * Animated checkmark component with draw animation
 * Perfect for success states and confirmations
 */
export function AnimatedCheckmark({
    size = 'md',
    variant = 'success',
    show = false,
    duration = 0.6,
    className,
    onComplete
}: AnimatedCheckmarkProps) {
    if (!show) return null

    return (
        <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                duration
            }}
            onAnimationComplete={onComplete}
            className={cn(
                'rounded-full flex items-center justify-center shadow-lg',
                sizeMap[size],
                colorMap[variant],
                className
            )}
        >
            <motion.div
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                    pathLength: { duration: duration * 0.8, ease: 'easeInOut' },
                    opacity: { duration: duration * 0.3 }
                }}
            >
                <Check className={iconSizeMap[size]} strokeWidth={3} />
            </motion.div>
        </motion.div>
    )
}

/**
 * Animated checkmark with circle draw animation
 * More elaborate version with SVG path animation
 */
export function AnimatedCheckmarkCircle({
    size = 'md',
    variant = 'success',
    show = false,
    duration = 0.8,
    className,
    onComplete
}: AnimatedCheckmarkProps) {
    if (!show) return null

    const sizeValue = {
        sm: 32,
        md: 48,
        lg: 64,
        xl: 96
    }[size]

    const strokeWidth = {
        sm: 2,
        md: 3,
        lg: 4,
        xl: 6
    }[size]

    const color = {
        success: '#22c55e',
        primary: 'hsl(var(--primary))',
        white: '#ffffff'
    }[variant]

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20
            }}
            onAnimationComplete={onComplete}
            className={cn('inline-block', className)}
        >
            <svg
                width={sizeValue}
                height={sizeValue}
                viewBox="0 0 52 52"
                className="animate-in fade-in"
            >
                {/* Circle */}
                <motion.circle
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                        duration: duration * 0.5,
                        ease: 'easeInOut'
                    }}
                />
                {/* Checkmark */}
                <motion.path
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                        duration: duration * 0.5,
                        delay: duration * 0.5,
                        ease: 'easeOut'
                    }}
                />
            </svg>
        </motion.div>
    )
}

/**
 * Success checkmark with pulse effect
 */
export function PulseCheckmark({
    size = 'md',
    variant = 'success',
    show = false,
    className
}: Omit<AnimatedCheckmarkProps, 'duration' | 'onComplete'>) {
    if (!show) return null

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
                'rounded-full flex items-center justify-center relative',
                sizeMap[size],
                colorMap[variant],
                className
            )}
        >
            {/* Pulse rings */}
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: variant === 'success' ? '#22c55e' : 'hsl(var(--primary))' }}
                animate={{
                    scale: [1, 1.5, 1.5],
                    opacity: [0.5, 0, 0]
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut'
                }}
            />
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: variant === 'success' ? '#22c55e' : 'hsl(var(--primary))' }}
                animate={{
                    scale: [1, 1.5, 1.5],
                    opacity: [0.5, 0, 0]
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: 0.5
                }}
            />

            <Check className={cn(iconSizeMap[size], 'relative z-10')} strokeWidth={3} />
        </motion.div>
    )
}

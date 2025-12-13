'use client'

import { motion, HTMLMotionProps, Variants } from 'framer-motion'
import { ReactNode } from 'react'
import {
    fadeIn,
    fadeInUp,
    fadeInScale,
    slideInLeft,
    slideInRight,
    staggerContainer,
    staggerItem,
    scrollFadeIn,
    viewportConfig,
    getVariants,
    SPRING,
    buttonTap,
    buttonHover,
    cardHover,
    cardPress,
} from '@/lib/animations'
import { cn } from '@/lib/utils'

// ============================================================================
// ANIMATED CONTAINERS
// ============================================================================

interface AnimatedContainerProps extends HTMLMotionProps<'div'> {
    children: ReactNode
    variant?: 'fade' | 'fadeUp' | 'fadeScale' | 'slideLeft' | 'slideRight'
    delay?: number
    className?: string
}

/**
 * Animated container with common entrance animations
 */
export function AnimatedContainer({
    children,
    variant = 'fade',
    delay = 0,
    className,
    ...props
}: AnimatedContainerProps) {
    const variants: Record<string, Variants> = {
        fade: fadeIn,
        fadeUp: fadeInUp,
        fadeScale: fadeInScale,
        slideLeft: slideInLeft,
        slideRight: slideInRight,
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={getVariants(variants[variant])}
            transition={{ delay }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

// ============================================================================
// STAGGER LISTS
// ============================================================================

interface StaggerListProps {
    children: ReactNode
    className?: string
    staggerDelay?: number
}

/**
 * Container that staggers children animations
 */
export function StaggerList({ children, className, staggerDelay = 0.05 }: StaggerListProps) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className={className}
        >
            {children}
        </motion.div>
    )
}

/**
 * Individual item in a stagger list
 */
export function StaggerItem({ children, className, ...props }: HTMLMotionProps<'div'>) {
    return (
        <motion.div
            variants={getVariants(staggerItem)}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

// ============================================================================
// SCROLL-TRIGGERED ANIMATIONS
// ============================================================================

interface ScrollRevealProps extends HTMLMotionProps<'div'> {
    children: ReactNode
    className?: string
}

/**
 * Reveals content when scrolling into view
 */
export function ScrollReveal({ children, className, ...props }: ScrollRevealProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            variants={getVariants(scrollFadeIn)}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

// ============================================================================
// INTERACTIVE BUTTONS
// ============================================================================

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
    children: ReactNode
    variant?: 'default' | 'ghost' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

/**
 * Button with smooth hover and tap animations
 */
export function AnimatedButton({
    children,
    variant = 'default',
    size = 'md',
    className,
    ...props
}: AnimatedButtonProps) {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    }

    const variantClasses = {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    }

    return (
        <motion.button
            whileHover={buttonHover}
            whileTap={buttonTap}
            transition={SPRING.snappy}
            className={cn(
                'rounded-lg font-medium transition-colors',
                sizeClasses[size],
                variantClasses[variant],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    )
}

// ============================================================================
// ANIMATED CARDS
// ============================================================================

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
    children: ReactNode
    hoverable?: boolean
    pressable?: boolean
    className?: string
}

/**
 * Card with hover and press animations
 */
export function AnimatedCard({
    children,
    hoverable = true,
    pressable = true,
    className,
    ...props
}: AnimatedCardProps) {
    return (
        <motion.div
            initial="rest"
            whileHover={hoverable ? "hover" : undefined}
            whileTap={pressable ? cardPress : undefined}
            variants={cardHover}
            className={cn('rounded-xl bg-card border', className)}
            {...props}
        >
            {children}
        </motion.div>
    )
}

// ============================================================================
// ANIMATED ICONS
// ============================================================================

interface AnimatedIconProps extends HTMLMotionProps<'div'> {
    children: ReactNode
    className?: string
}

/**
 * Icon with hover and tap animations
 */
export function AnimatedIcon({ children, className, ...props }: AnimatedIconProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            transition={SPRING.snappy}
            className={cn('inline-flex', className)}
            {...props}
        >
            {children}
        </motion.div>
    )
}

// ============================================================================
// FLOATING ELEMENTS (2025 Trend)
// ============================================================================

interface FloatingElementProps extends HTMLMotionProps<'div'> {
    children: ReactNode
    intensity?: 'subtle' | 'normal' | 'strong'
    className?: string
}

/**
 * Element with subtle floating animation
 */
export function FloatingElement({
    children,
    intensity = 'normal',
    className,
    ...props
}: FloatingElementProps) {
    const intensityMap = {
        subtle: { y: [-2, 2, -2], duration: 3 },
        normal: { y: [-5, 5, -5], duration: 4 },
        strong: { y: [-10, 10, -10], duration: 5 },
    }

    const config = intensityMap[intensity]

    return (
        <motion.div
            animate={{
                y: config.y,
            }}
            transition={{
                duration: config.duration,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

// ============================================================================
// MAGNETIC BUTTON (2025 Trend)
// ============================================================================

interface MagneticButtonProps extends HTMLMotionProps<'button'> {
    children: ReactNode
    strength?: number
    className?: string
}

/**
 * Button that follows cursor with magnetic effect
 */
export function MagneticButton({
    children,
    strength = 20,
    className,
    ...props
}: MagneticButtonProps) {
    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2

        e.currentTarget.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`
    }

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.transform = 'translate(0px, 0px)'
    }

    return (
        <motion.button
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileTap={{ scale: 0.95 }}
            transition={SPRING.smooth}
            className={className}
            style={{ transition: 'transform 0.3s ease-out' }}
            {...props}
        >
            {children}
        </motion.button>
    )
}

// ============================================================================
// SHIMMER EFFECT (Loading State)
// ============================================================================

interface ShimmerProps {
    className?: string
}

/**
 * Shimmer loading effect
 */
export function Shimmer({ className }: ShimmerProps) {
    return (
        <motion.div
            className={cn('relative overflow-hidden bg-muted', className)}
            animate={{
                backgroundPosition: ['200% 0', '-200% 0'],
            }}
            transition={{
                duration: 2,
                ease: 'linear',
                repeat: Infinity,
            }}
            style={{
                backgroundImage:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                backgroundSize: '200% 100%',
            }}
        />
    )
}

// ============================================================================
// COUNTER ANIMATION
// ============================================================================

interface CounterProps {
    value: number
    duration?: number
    className?: string
}

/**
 * Animated number counter
 */
export function Counter({ value, duration = 1, className }: CounterProps) {
    return (
        <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={className}
        >
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration }}
            >
                {value}
            </motion.span>
        </motion.span>
    )
}

// ============================================================================
// RIPPLE EFFECT
// ============================================================================

interface RippleButtonProps extends HTMLMotionProps<'button'> {
    children: ReactNode
    className?: string
}

/**
 * Button with ripple effect on click
 */
export function RippleButton({ children, className, onClick, ...props }: RippleButtonProps) {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        const button = e.currentTarget
        const ripple = document.createElement('span')
        const rect = button.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height)
        const x = e.clientX - rect.left - size / 2
        const y = e.clientY - rect.top - size / 2

        ripple.style.width = ripple.style.height = `${size}px`
        ripple.style.left = `${x}px`
        ripple.style.top = `${y}px`
        ripple.classList.add('ripple')

        button.appendChild(ripple)

        setTimeout(() => {
            ripple.remove()
        }, 600)

        onClick?.(e)
    }

    return (
        <motion.button
            onClick={handleClick}
            className={cn('relative overflow-hidden', className)}
            whileTap={{ scale: 0.95 }}
            {...props}
        >
            {children}
            <style jsx>{`
                .ripple {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    transform: scale(0);
                    animation: ripple-animation 0.6s ease-out;
                    pointer-events: none;
                }

                @keyframes ripple-animation {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `}</style>
        </motion.button>
    )
}

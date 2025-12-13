'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Confetti } from './confetti'
import { AnimatedCheckmark, AnimatedCheckmarkCircle } from './animated-checkmark'
import { celebrationHaptic, bigWinHaptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

interface SuccessCelebrationProps {
    /**
     * Show the celebration
     */
    show: boolean
    /**
     * Title of the celebration
     */
    title?: string
    /**
     * Description/subtitle
     */
    description?: string
    /**
     * Type of celebration
     */
    type?: 'default' | 'big' | 'subtle'
    /**
     * Confetti type
     */
    confettiType?: 'default' | 'fireworks' | 'stars' | 'cannon' | 'school-pride' | 'realistic'
    /**
     * Duration in milliseconds
     */
    duration?: number
    /**
     * Callback when celebration ends
     */
    onComplete?: () => void
    /**
     * Custom colors for confetti
     */
    colors?: string[]
}

/**
 * Complete success celebration component
 * Combines confetti, animated checkmark, haptic feedback, and optional message
 */
export function SuccessCelebration({
    show,
    title,
    description,
    type = 'default',
    confettiType = 'default',
    duration = 3000,
    onComplete,
    colors
}: SuccessCelebrationProps) {
    const [showContent, setShowContent] = useState(false)

    useEffect(() => {
        if (show) {
            // Trigger haptic feedback
            if (type === 'big') {
                bigWinHaptic()
            } else {
                celebrationHaptic()
            }

            // Show content after a brief delay
            const timer = setTimeout(() => setShowContent(true), 100)

            // Auto-hide after duration
            if (onComplete) {
                const completeTimer = setTimeout(onComplete, duration)
                return () => {
                    clearTimeout(timer)
                    clearTimeout(completeTimer)
                }
            }

            return () => clearTimeout(timer)
        } else {
            setShowContent(false)
        }
    }, [show, type, duration, onComplete])

    if (!show) return null

    return (
        <>
            {/* Confetti */}
            {type !== 'subtle' && (
                <Confetti
                    trigger={show}
                    type={confettiType}
                    duration={duration}
                    colors={colors}
                />
            )}

            {/* Overlay with message */}
            <AnimatePresence>
                {showContent && (title || description) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={onComplete}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="bg-card border border-border rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Checkmark */}
                            <div className="flex justify-center mb-6">
                                <AnimatedCheckmarkCircle
                                    show={showContent}
                                    size={type === 'big' ? 'xl' : 'lg'}
                                    variant="success"
                                />
                            </div>

                            {/* Title */}
                            {title && (
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-2xl font-bold mb-2"
                                >
                                    {title}
                                </motion.h2>
                            )}

                            {/* Description */}
                            {description && (
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-muted-foreground"
                                >
                                    {description}
                                </motion.p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

/**
 * Inline success animation - for toasts and inline feedback
 */
export function InlineSuccess({
    show,
    message,
    size = 'md',
    className
}: {
    show: boolean
    message?: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}) {
    useEffect(() => {
        if (show) {
            celebrationHaptic()
        }
    }, [show])

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={cn('flex items-center gap-3', className)}
                >
                    <AnimatedCheckmark
                        show={show}
                        size={size}
                        variant="success"
                    />
                    {message && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-sm font-medium text-green-600 dark:text-green-400"
                        >
                            {message}
                        </motion.span>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

/**
 * Success toast - appears at the top of the screen
 */
export function SuccessToast({
    show,
    message,
    duration = 3000,
    onClose
}: {
    show: boolean
    message: string
    duration?: number
    onClose?: () => void
}) {
    useEffect(() => {
        if (show) {
            celebrationHaptic()
            if (onClose) {
                const timer = setTimeout(onClose, duration)
                return () => clearTimeout(timer)
            }
        }
    }, [show, duration, onClose])

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3"
                >
                    <AnimatedCheckmark
                        show={show}
                        size="sm"
                        variant="white"
                    />
                    <span className="font-medium">{message}</span>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

/**
 * Button with success state
 */
export function SuccessButton({
    children,
    onClick,
    isSuccess,
    successMessage = '¡Hecho!',
    successDuration = 2000,
    className,
    ...props
}: {
    children: React.ReactNode
    onClick?: () => void | Promise<void>
    isSuccess?: boolean
    successMessage?: string
    successDuration?: number
    className?: string
    [key: string]: any
}) {
    const [showSuccess, setShowSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (isSuccess) {
            setShowSuccess(true)
            celebrationHaptic()
            const timer = setTimeout(() => setShowSuccess(false), successDuration)
            return () => clearTimeout(timer)
        }
    }, [isSuccess, successDuration])

    const handleClick = async () => {
        if (onClick) {
            setIsLoading(true)
            try {
                await onClick()
            } finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <motion.button
            onClick={handleClick}
            disabled={isLoading || showSuccess}
            className={cn(
                'relative px-6 py-3 rounded-lg font-medium transition-all',
                showSuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90',
                className
            )}
            whileTap={{ scale: 0.95 }}
            {...props}
        >
            <AnimatePresence mode="wait">
                {showSuccess ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                    >
                        <AnimatedCheckmark show={true} size="sm" variant="white" />
                        <span>{successMessage}</span>
                    </motion.div>
                ) : (
                    <motion.div
                        key="default"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    )
}

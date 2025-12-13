import { Variants } from 'framer-motion'

/**
 * Animation utilities and variants for consistent micro-interactions
 * Based on 2025 trends: subtle, purposeful, performant
 */

// ============================================================================
// TIMING CONSTANTS (2025 Best Practices)
// ============================================================================

export const ANIMATION_DURATION = {
    instant: 0.15,      // Ultra-fast feedback (150ms)
    fast: 0.2,          // Quick interactions (200ms)
    normal: 0.3,        // Standard transitions (300ms)
    slow: 0.5,          // Deliberate animations (500ms)
    slower: 0.8,        // Emphasis animations (800ms)
} as const

// ============================================================================
// EASING FUNCTIONS (Natural, Physics-Based)
// ============================================================================

export const EASING = {
    // Smooth, natural easing
    smooth: [0.4, 0, 0.2, 1],           // Material Design standard
    snappy: [0.22, 1, 0.36, 1],         // Quick and satisfying
    bounce: [0.68, -0.55, 0.265, 1.55], // Playful bounce
    elastic: [0.175, 0.885, 0.32, 1.275], // Elastic feel

    // Directional easing
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],

    // Special effects
    anticipate: [0.68, -0.55, 0.265, 1.55],
} as const

// ============================================================================
// SPRING CONFIGURATIONS (Physics-Based Motion)
// ============================================================================

export const SPRING = {
    // Gentle, smooth springs
    gentle: { type: 'spring' as const, stiffness: 120, damping: 14 },
    smooth: { type: 'spring' as const, stiffness: 260, damping: 20 },

    // Snappy, responsive springs
    snappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
    bouncy: { type: 'spring' as const, stiffness: 300, damping: 10 },

    // Slow, deliberate springs
    slow: { type: 'spring' as const, stiffness: 100, damping: 15 },

    // Ultra-responsive (2025 trend: instant feedback)
    instant: { type: 'spring' as const, stiffness: 500, damping: 35 },
} as const

// ============================================================================
// FADE ANIMATIONS
// ============================================================================

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: ANIMATION_DURATION.fast, ease: EASING.smooth }
    }
}

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: ANIMATION_DURATION.normal, ease: EASING.smooth }
    }
}

export const fadeInDown: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: ANIMATION_DURATION.normal, ease: EASING.smooth }
    }
}

export const fadeInScale: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: ANIMATION_DURATION.normal, ease: EASING.smooth }
    }
}

// ============================================================================
// SLIDE ANIMATIONS
// ============================================================================

export const slideInLeft: Variants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { duration: ANIMATION_DURATION.normal, ease: EASING.smooth }
    }
}

export const slideInRight: Variants = {
    hidden: { x: 20, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { duration: ANIMATION_DURATION.normal, ease: EASING.smooth }
    }
}

// ============================================================================
// SCALE ANIMATIONS
// ============================================================================

export const scaleIn: Variants = {
    hidden: { scale: 0 },
    visible: {
        scale: 1,
        transition: SPRING.bouncy
    }
}

export const scalePop: Variants = {
    hidden: { scale: 0.8 },
    visible: {
        scale: 1,
        transition: SPRING.snappy
    }
}

// ============================================================================
// STAGGER ANIMATIONS (Lists, Grids)
// ============================================================================

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,  // 50ms delay between children
            delayChildren: 0.1,
        }
    }
}

export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: ANIMATION_DURATION.fast, ease: EASING.smooth }
    }
}

// ============================================================================
// BUTTON / INTERACTIVE ANIMATIONS
// ============================================================================

export const buttonTap = {
    scale: 0.95,
    transition: { duration: ANIMATION_DURATION.instant }
}

export const buttonHover = {
    scale: 1.02,
    transition: { duration: ANIMATION_DURATION.fast }
}

export const iconHover = {
    scale: 1.1,
    rotate: 5,
    transition: SPRING.snappy
}

export const iconTap = {
    scale: 0.9,
    transition: { duration: ANIMATION_DURATION.instant }
}

// ============================================================================
// CARD ANIMATIONS
// ============================================================================

export const cardHover: Variants = {
    rest: {
        scale: 1,
        y: 0,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    hover: {
        scale: 1.02,
        y: -4,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        transition: { duration: ANIMATION_DURATION.fast, ease: EASING.smooth }
    }
}

export const cardPress = {
    scale: 0.98,
    transition: { duration: ANIMATION_DURATION.instant }
}

// ============================================================================
// NOTIFICATION / TOAST ANIMATIONS
// ============================================================================

export const toastSlideIn: Variants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: SPRING.snappy
    },
    exit: {
        y: -100,
        opacity: 0,
        transition: { duration: ANIMATION_DURATION.fast, ease: EASING.easeIn }
    }
}

export const toastSlideInBottom: Variants = {
    hidden: { y: 100, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: SPRING.snappy
    },
    exit: {
        y: 100,
        opacity: 0,
        transition: { duration: ANIMATION_DURATION.fast, ease: EASING.easeIn }
    }
}

// ============================================================================
// MODAL / DIALOG ANIMATIONS
// ============================================================================

export const modalBackdrop: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: ANIMATION_DURATION.fast }
    },
    exit: {
        opacity: 0,
        transition: { duration: ANIMATION_DURATION.fast }
    }
}

export const modalContent: Variants = {
    hidden: { scale: 0.95, opacity: 0, y: 20 },
    visible: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: SPRING.smooth
    },
    exit: {
        scale: 0.95,
        opacity: 0,
        y: 20,
        transition: { duration: ANIMATION_DURATION.fast, ease: EASING.easeIn }
    }
}

// ============================================================================
// DRAWER / SHEET ANIMATIONS
// ============================================================================

export const drawerSlideUp: Variants = {
    hidden: { y: '100%' },
    visible: {
        y: 0,
        transition: SPRING.smooth
    },
    exit: {
        y: '100%',
        transition: { duration: ANIMATION_DURATION.normal, ease: EASING.easeIn }
    }
}

export const drawerSlideRight: Variants = {
    hidden: { x: '-100%' },
    visible: {
        x: 0,
        transition: SPRING.smooth
    },
    exit: {
        x: '-100%',
        transition: { duration: ANIMATION_DURATION.normal, ease: EASING.easeIn }
    }
}

// ============================================================================
// LOADING / SKELETON ANIMATIONS
// ============================================================================

export const shimmer = {
    animate: {
        backgroundPosition: ['200% 0', '-200% 0'],
        transition: {
            duration: 2,
            ease: 'linear',
            repeat: Infinity,
        }
    }
}

export const pulse = {
    animate: {
        opacity: [0.5, 1, 0.5],
        transition: {
            duration: 1.5,
            ease: 'easeInOut',
            repeat: Infinity,
        }
    }
}

export const spin = {
    animate: {
        rotate: 360,
        transition: {
            duration: 1,
            ease: 'linear',
            repeat: Infinity,
        }
    }
}

// ============================================================================
// ATTENTION-GRABBING ANIMATIONS
// ============================================================================

export const shake: Variants = {
    shake: {
        x: [-10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
    }
}

export const wiggle: Variants = {
    wiggle: {
        rotate: [-5, 5, -5, 5, 0],
        transition: { duration: 0.5 }
    }
}

export const heartbeat: Variants = {
    beat: {
        scale: [1, 1.1, 1, 1.1, 1],
        transition: { duration: 0.6 }
    }
}

// ============================================================================
// MORPHING ANIMATIONS (2025 Trend)
// ============================================================================

export const morphButton: Variants = {
    button: {
        width: 'auto',
        borderRadius: '0.5rem',
        transition: SPRING.smooth
    },
    loading: {
        width: '3rem',
        borderRadius: '9999px',
        transition: SPRING.smooth
    },
    success: {
        width: '3rem',
        borderRadius: '9999px',
        backgroundColor: '#22c55e',
        transition: SPRING.smooth
    }
}

// ============================================================================
// SCROLL-TRIGGERED ANIMATIONS
// ============================================================================

export const scrollFadeIn: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: ANIMATION_DURATION.slow, ease: EASING.smooth }
    }
}

export const scrollSlideIn: Variants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: ANIMATION_DURATION.slow, ease: EASING.smooth }
    }
}

// ============================================================================
// NUMBER COUNTER ANIMATION
// ============================================================================

export const counterVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: ANIMATION_DURATION.fast }
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a stagger animation with custom delay
 */
export const createStagger = (staggerDelay: number = 0.05, delayChildren: number = 0) => ({
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: staggerDelay,
            delayChildren,
        }
    }
})

/**
 * Create a custom fade animation
 */
export const createFade = (duration: number = ANIMATION_DURATION.normal) => ({
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration, ease: EASING.smooth }
    }
})

/**
 * Create a custom slide animation
 */
export const createSlide = (
    direction: 'up' | 'down' | 'left' | 'right',
    distance: number = 20,
    duration: number = ANIMATION_DURATION.normal
) => {
    const axis = direction === 'up' || direction === 'down' ? 'y' : 'x'
    const value = direction === 'up' || direction === 'left' ? -distance : distance

    return {
        hidden: { [axis]: value, opacity: 0 },
        visible: {
            [axis]: 0,
            opacity: 1,
            transition: { duration, ease: EASING.smooth }
        }
    }
}

/**
 * Viewport animation config for scroll-triggered animations
 */
export const viewportConfig = {
    once: true,          // Animate only once
    amount: 0.3,         // Trigger when 30% visible
    margin: '-50px'      // Start animation 50px before entering viewport
}

/**
 * Reduced motion check (Accessibility)
 */
export const shouldReduceMotion = () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get animation variants with reduced motion support
 */
export const getVariants = (variants: Variants): Variants => {
    if (shouldReduceMotion()) {
        // Return instant transitions for reduced motion
        return {
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.01 } }
        }
    }
    return variants
}

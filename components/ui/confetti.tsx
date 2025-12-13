'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiProps {
    /**
     * Trigger the confetti animation
     */
    trigger?: boolean
    /**
     * Type of confetti animation
     */
    type?: 'default' | 'fireworks' | 'stars' | 'cannon' | 'school-pride' | 'realistic'
    /**
     * Duration of the animation in milliseconds
     */
    duration?: number
    /**
     * Colors for the confetti
     */
    colors?: string[]
    /**
     * Origin point for the confetti (0-1 for both x and y)
     */
    origin?: { x: number; y: number }
}

/**
 * Confetti component for celebrations
 * Uses canvas-confetti library for high-performance animations
 */
export function Confetti({
    trigger = false,
    type = 'default',
    duration = 3000,
    colors,
    origin = { x: 0.5, y: 0.5 }
}: ConfettiProps) {
    useEffect(() => {
        if (!trigger) return

        const end = Date.now() + duration

        switch (type) {
            case 'fireworks':
                fireworks(end, colors)
                break
            case 'stars':
                stars(end, colors)
                break
            case 'cannon':
                cannon(origin, colors)
                break
            case 'school-pride':
                schoolPride(end, colors)
                break
            case 'realistic':
                realistic(end, colors)
                break
            default:
                defaultConfetti(colors)
        }
    }, [trigger, type, duration, colors, origin])

    return null // This component doesn't render anything
}

// ============================================================================
// CONFETTI PATTERNS
// ============================================================================

/**
 * Default confetti burst
 */
function defaultConfetti(colors?: string[]) {
    const count = 200
    const defaults = {
        origin: { y: 0.7 },
        colors: colors || ['#FF4D4D', '#FFD700', '#4D96FF', '#6AC5FE', '#FF8585']
    }

    function fire(particleRatio: number, opts: any) {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
        })
    }

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
    })
    fire(0.2, {
        spread: 60,
    })
    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
    })
    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
    })
    fire(0.1, {
        spread: 120,
        startVelocity: 45,
    })
}

/**
 * Fireworks effect - multiple bursts
 */
function fireworks(end: number, colors?: string[]) {
    const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 0,
        colors: colors || ['#FF4D4D', '#FFD700', '#4D96FF', '#6AC5FE', '#FF8585']
    }

    const interval = setInterval(() => {
        const timeLeft = end - Date.now()

        if (timeLeft <= 0) {
            return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / 3000)

        // Random positions
        confetti({
            ...defaults,
            particleCount,
            origin: { x: Math.random(), y: Math.random() - 0.2 }
        })
    }, 250)
}

/**
 * Stars effect - falling stars
 */
function stars(end: number, colors?: string[]) {
    const defaults = {
        spread: 360,
        ticks: 50,
        gravity: 0,
        decay: 0.94,
        startVelocity: 30,
        colors: colors || ['#FFD700', '#FFA500', '#FF8C00'],
        shapes: ['star'] as confetti.Shape[]
    }

    const interval = setInterval(() => {
        const timeLeft = end - Date.now()

        if (timeLeft <= 0) {
            return clearInterval(interval)
        }

        const particleCount = 15 * (timeLeft / 3000)

        confetti({
            ...defaults,
            particleCount,
            origin: { x: Math.random(), y: Math.random() * 0.5 }
        })
    }, 200)
}

/**
 * Cannon effect - shoots from a specific point
 */
function cannon(origin: { x: number; y: number }, colors?: string[]) {
    confetti({
        particleCount: 100,
        spread: 70,
        origin,
        colors: colors || ['#FF4D4D', '#FFD700', '#4D96FF', '#6AC5FE', '#FF8585']
    })
}

/**
 * School pride effect - continuous confetti from sides
 */
function schoolPride(end: number, colors?: string[]) {
    const defaults = {
        colors: colors || ['#FF4D4D', '#FFD700', '#4D96FF']
    }

    const interval = setInterval(() => {
        const timeLeft = end - Date.now()

        if (timeLeft <= 0) {
            return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / 3000)

        // Left side
        confetti({
            ...defaults,
            particleCount,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
        })

        // Right side
        confetti({
            ...defaults,
            particleCount,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        })
    }, 250)
}

/**
 * Realistic confetti - physics-based
 */
function realistic(end: number, colors?: string[]) {
    const defaults = {
        colors: colors || ['#FF4D4D', '#FFD700', '#4D96FF', '#6AC5FE', '#FF8585', '#9D4EDD']
    }

    function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
        const timeLeft = end - Date.now()

        if (timeLeft <= 0) {
            return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / 3000)

        confetti({
            ...defaults,
            angle: randomInRange(55, 125),
            spread: randomInRange(50, 70),
            particleCount,
            origin: { y: 0.6 }
        })
    }, 250)
}

// ============================================================================
// HELPER FUNCTIONS (can be used directly)
// ============================================================================

/**
 * Quick confetti burst - use this for simple celebrations
 */
export function fireConfetti(colors?: string[]) {
    defaultConfetti(colors)
}

/**
 * Confetti from a specific element
 */
export function fireConfettiFromElement(element: HTMLElement, colors?: string[]) {
    const rect = element.getBoundingClientRect()
    const x = (rect.left + rect.width / 2) / window.innerWidth
    const y = (rect.top + rect.height / 2) / window.innerHeight

    cannon({ x, y }, colors)
}

/**
 * Clear all confetti
 */
export function clearConfetti() {
    confetti.reset()
}

'use client'

import { useEffect, useRef } from 'react'

interface AnimatedBackgroundProps {
    colors: {
        primary: string
        secondary: string
        tertiary: string
    }
}

export function AnimatedBackground({ colors }: AnimatedBackgroundProps) {
    const blob1Ref = useRef<HTMLDivElement>(null)
    const blob2Ref = useRef<HTMLDivElement>(null)
    const blob3Ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e
            const centerX = window.innerWidth / 2
            const centerY = window.innerHeight / 2

            // Calculate offset based on distance from center
            const offsetX = (clientX - centerX) / 50
            const offsetY = (clientY - centerY) / 50

            if (blob1Ref.current) {
                blob1Ref.current.style.transform = `translate(${offsetX}px, ${offsetY}px)`
            }
            if (blob2Ref.current) {
                blob2Ref.current.style.transform = `translate(${-offsetX}px, ${-offsetY}px)`
            }
            if (blob3Ref.current) {
                blob3Ref.current.style.transform = `translate(${offsetX * 0.5}px, ${-offsetY * 0.5}px)`
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    return (
        <>
            {/* Subtle gradient background */}
            <div className={`fixed inset-0 bg-gradient-to-br ${colors.primary} ${colors.secondary} ${colors.tertiary} -z-10`} />

            {/* Animated blobs that follow cursor */}
            <div
                ref={blob1Ref}
                className={`fixed top-0 -left-4 w-96 h-96 ${colors.primary.replace('from-', 'bg-').replace('/20', '/20')} rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob transition-transform duration-1000 ease-out -z-10`}
            />
            <div
                ref={blob2Ref}
                className={`fixed top-0 -right-4 w-96 h-96 ${colors.secondary.replace('via-', 'bg-').replace('/20', '/20')} rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000 transition-transform duration-1000 ease-out -z-10`}
            />
            <div
                ref={blob3Ref}
                className={`fixed -bottom-8 left-20 w-96 h-96 ${colors.tertiary.replace('to-', 'bg-').replace('/20', '/20')} rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000 transition-transform duration-1000 ease-out -z-10`}
            />
        </>
    )
}

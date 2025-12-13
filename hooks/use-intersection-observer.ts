'use client'

import { useEffect, useRef, useState, RefObject } from 'react'

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
    /**
     * Trigger only once and disconnect after first intersection
     * @default true
     */
    triggerOnce?: boolean
    /**
     * Enable the observer
     * @default true
     */
    enabled?: boolean
}

/**
 * Hook for lazy loading components with Intersection Observer
 * 
 * @example
 * ```tsx
 * const HeavyComponent = () => {
 *   const { ref, isVisible } = useIntersectionObserver()
 *   
 *   return (
 *     <div ref={ref}>
 *       {isVisible ? <ActualHeavyComponent /> : <Skeleton />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
    options: UseIntersectionObserverOptions = {}
) {
    const {
        threshold = 0,
        root = null,
        rootMargin = '50px', // Start loading slightly before element is visible
        triggerOnce = true,
        enabled = true,
    } = options

    const [isVisible, setIsVisible] = useState(false)
    const [hasIntersected, setHasIntersected] = useState(false)
    const ref = useRef<T>(null)

    useEffect(() => {
        if (!enabled) return
        if (triggerOnce && hasIntersected) return
        if (!ref.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                const isIntersecting = entry.isIntersecting

                if (isIntersecting) {
                    setIsVisible(true)
                    setHasIntersected(true)

                    if (triggerOnce) {
                        observer.disconnect()
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false)
                }
            },
            {
                threshold,
                root,
                rootMargin,
            }
        )

        observer.observe(ref.current)

        return () => {
            observer.disconnect()
        }
    }, [enabled, hasIntersected, threshold, root, rootMargin, triggerOnce])

    return { ref, isVisible, hasIntersected }
}

/**
 * Hook for lazy loading with a custom ref
 * Useful when you need to attach the ref to a specific element
 * 
 * @example
 * ```tsx
 * const myRef = useRef<HTMLDivElement>(null)
 * const isVisible = useIntersectionObserverWithRef(myRef)
 * 
 * return (
 *   <div ref={myRef}>
 *     {isVisible ? <HeavyComponent /> : <Skeleton />}
 *   </div>
 * )
 * ```
 */
export function useIntersectionObserverWithRef<T extends HTMLElement = HTMLDivElement>(
    ref: RefObject<T>,
    options: UseIntersectionObserverOptions = {}
): boolean {
    const {
        threshold = 0,
        root = null,
        rootMargin = '50px',
        triggerOnce = true,
        enabled = true,
    } = options

    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (!enabled) return
        if (!ref.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    if (triggerOnce) {
                        observer.disconnect()
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false)
                }
            },
            {
                threshold,
                root,
                rootMargin,
            }
        )

        observer.observe(ref.current)

        return () => {
            observer.disconnect()
        }
    }, [ref, enabled, threshold, root, rootMargin, triggerOnce])

    return isVisible
}

/**
 * Hook for preloading images when they're about to be visible
 * 
 * @example
 * ```tsx
 * const { ref, isVisible } = useImagePreload()
 * 
 * return (
 *   <div ref={ref}>
 *     {isVisible && <img src={heavyImage} loading="lazy" />}
 *   </div>
 * )
 * ```
 */
export function useImagePreload<T extends HTMLElement = HTMLDivElement>(
    options: UseIntersectionObserverOptions = {}
) {
    return useIntersectionObserver<T>({
        rootMargin: '200px', // Start loading images earlier
        ...options,
    })
}

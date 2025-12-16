'use client'

import { X, Download } from 'lucide-react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ImageModalProps {
    src: string | null
    onClose: () => void
}

export function ImageModal({ src, onClose }: ImageModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    useEffect(() => {
        if (src) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = 'unset'
        return () => { document.body.style.overflow = 'unset' }
    }, [src])

    const handleDragEnd = (event: unknown, info: PanInfo) => {
        // Close if dragged down (positive y) more than 100px
        if (info.offset.y > 100) {
            onClose()
        }
    }

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {src && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl touch-none"
                    onClick={onClose}
                >
                    {/* Controls */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-end gap-4 z-[102] bg-gradient-to-b from-black/50 to-transparent pt-safe">
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                const link = document.createElement('a');
                                link.href = src;
                                link.download = 'image.jpg';
                                link.click();
                            }}
                            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
                        >
                            <Download className="h-5 w-5" />
                        </motion.button>
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
                        >
                            <X className="h-5 w-5" />
                        </motion.button>
                    </div>

                    <motion.img
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 100 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.7}
                        onDragEnd={handleDragEnd}
                        src={src}
                        alt="Zoom"
                        className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl cursor-grab active:cursor-grabbing"
                        onClick={(e) => e.stopPropagation()}
                    />
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}


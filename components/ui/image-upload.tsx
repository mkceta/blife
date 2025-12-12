'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Camera, Plus } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { mediumHaptic, simpleHaptic } from '@/lib/haptics'

interface ImageUploadProps {
    value: File[]
    onChange: (files: File[]) => void
    onRemove: (index: number) => void
    maxFiles?: number
    existingImages?: string[]
    onRemoveExisting?: (index: number) => void
    compact?: boolean // New prop for tighter layouts (like posts)
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    maxFiles = 5,
    existingImages = [],
    onRemoveExisting,
    compact = false
}: ImageUploadProps) {
    const [previews, setPreviews] = useState<string[]>([])

    const onDrop = useCallback((acceptedFiles: File[]) => {
        simpleHaptic()
        const totalCurrent = value.length + existingImages.length
        const remainingSlots = maxFiles - totalCurrent

        if (remainingSlots <= 0) return

        const newFiles = acceptedFiles.slice(0, remainingSlots)

        // Create previews
        const newPreviews = newFiles.map(file => URL.createObjectURL(file))
        setPreviews(prev => [...prev, ...newPreviews])

        onChange([...value, ...newFiles])
    }, [value, existingImages, maxFiles, onChange])

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: maxFiles - (value.length + existingImages.length),
        disabled: (value.length + existingImages.length) >= maxFiles,
        noClick: true // We manually trigger open for better control
    })

    const handleRemoveNew = (index: number) => {
        mediumHaptic()
        URL.revokeObjectURL(previews[index])
        setPreviews(prev => prev.filter((_, i) => i !== index))
        onRemove(index)
    }

    const handleRemoveExisting = (index: number) => {
        mediumHaptic()
        if (onRemoveExisting) onRemoveExisting(index)
    }

    const totalCount = value.length + existingImages.length
    const isEmpty = totalCount === 0

    return (
        <div className="space-y-3">
            <div {...getRootProps()} className="outline-none">
                <input {...getInputProps()} />

                {/* EMPTY STATE - Hero Card */}
                {isEmpty ? (
                    <div
                        onClick={() => {
                            simpleHaptic()
                            open()
                        }}
                        className={cn(
                            "relative overflow-hidden rounded-2xl border-2 border-dashed border-border transition-all duration-300",
                            "bg-muted/30 hover:bg-muted/50 active:scale-[0.98]",
                            isDragActive ? "border-primary bg-primary/5" : "hover:border-primary/50",
                            compact ? "h-32" : "h-52"
                        )}
                    >
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                            <div className="p-4 rounded-full bg-background shadow-sm border border-border">
                                <Camera className="h-6 w-6 text-foreground" strokeWidth={1.5} />
                            </div>
                            <div className="text-center px-4">
                                <p className="text-sm font-medium text-foreground">Añadir fotos</p>
                                <p className="text-xs opacity-70 mt-1">
                                    {isDragActive ? 'Suelta para subir' : `Hasta ${maxFiles} imágenes`}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* POPULATED STATE - Horizontal Scroll */
                    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 -mx-1 snap-x scrollbar-hide">
                        {/* Add Button (First item) */}
                        {totalCount < maxFiles && (
                            <div
                                onClick={() => {
                                    simpleHaptic()
                                    open()
                                }}
                                className={cn(
                                    "flex-shrink-0 relative flex items-center justify-center rounded-xl border-2 border-dashed border-border transition-all duration-300",
                                    "bg-muted/30 hover:bg-muted/50 active:scale-[0.95] cursor-pointer snap-start",
                                    isDragActive && "border-primary bg-primary/5",
                                    "w-28 h-28" // Fixed square size for the strip
                                )}
                            >
                                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                    <Plus className="h-6 w-6" />
                                    <span className="text-[10px] font-medium">Añadir</span>
                                </div>
                            </div>
                        )}

                        {/* Existing Images */}
                        {existingImages.map((url, i) => (
                            <div key={`existing-${i}`} className="flex-shrink-0 relative w-28 h-28 rounded-xl overflow-hidden border border-border shadow-sm snap-start group animate-in zoom-in-50 duration-300">
                                <Image src={url} alt="Preview" fill className="object-cover" />
                                {onRemoveExisting && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveExisting(i)
                                        }}
                                        className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white rounded-full p-1.5 hover:bg-destructive transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1">
                                    <p className="text-[9px] text-white text-center font-medium opacity-80">Guardada</p>
                                </div>
                            </div>
                        ))}

                        {/* New Images Previews */}
                        {previews.map((src, i) => (
                            <div key={`new-${i}`} className="flex-shrink-0 relative w-28 h-28 rounded-xl overflow-hidden border border-border shadow-sm snap-start group animate-in zoom-in-50 duration-300">
                                <Image src={src} alt="New Preview" fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemoveNew(i)
                                    }}
                                    className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white rounded-full p-1.5 hover:bg-destructive transition-colors shadow-md"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Counter / Helper Text */}
            {!isEmpty && (
                <div className="flex justify-between items-center px-1">
                    <p className="text-xs text-muted-foreground pl-1">
                        Desliza para ver más
                    </p>
                    <p className="text-xs font-medium bg-muted/50 px-2 py-0.5 rounded-full">
                        {totalCount} / {maxFiles}
                    </p>
                </div>
            )}
        </div>
    )
}

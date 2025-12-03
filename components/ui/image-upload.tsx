'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
    value: File[]
    onChange: (files: File[]) => void
    onRemove: (index: number) => void
    maxFiles?: number
    existingImages?: string[]
    onRemoveExisting?: (index: number) => void
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    maxFiles = 5,
    existingImages = [],
    onRemoveExisting
}: ImageUploadProps) {
    const [previews, setPreviews] = useState<string[]>([])

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const totalCurrent = value.length + existingImages.length
        const remainingSlots = maxFiles - totalCurrent

        if (remainingSlots <= 0) return

        const newFiles = acceptedFiles.slice(0, remainingSlots)

        // Create previews
        const newPreviews = newFiles.map(file => URL.createObjectURL(file))
        setPreviews(prev => [...prev, ...newPreviews])

        onChange([...value, ...newFiles])
    }, [value, existingImages, maxFiles, onChange])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: maxFiles - (value.length + existingImages.length),
        disabled: (value.length + existingImages.length) >= maxFiles
    })

    const handleRemoveNew = (index: number) => {
        URL.revokeObjectURL(previews[index])
        setPreviews(prev => prev.filter((_, i) => i !== index))
        onRemove(index)
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Existing Images */}
                {existingImages.map((url, i) => (
                    <div key={`existing-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted group">
                        <Image src={url} alt="Preview" fill className="object-cover" />
                        {onRemoveExisting && (
                            <button
                                type="button"
                                onClick={() => onRemoveExisting(i)}
                                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                ))}

                {/* New Images Previews */}
                {previews.map((src, i) => (
                    <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted group">
                        <Image src={src} alt="Preview" fill className="object-cover" />
                        <button
                            type="button"
                            onClick={() => handleRemoveNew(i)}
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {/* Dropzone */}
                {(value.length + existingImages.length) < maxFiles && (
                    <div
                        {...getRootProps()}
                        className={cn(
                            "aspect-square rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 bg-muted/5 hover:bg-muted/10 hover:border-primary/50",
                            isDragActive && "border-primary bg-primary/5 scale-[0.98]"
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                            <div className="p-3 rounded-full bg-muted/50">
                                <Upload className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">
                                    {isDragActive ? 'Suelta aquí' : 'Subir fotos'}
                                </p>
                                <p className="text-xs">
                                    Arrastra o haz clic
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
                {value.length + existingImages.length} de {maxFiles} fotos
            </p>
        </div>
    )
}

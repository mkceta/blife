'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, X, Loader2, Paperclip, Camera as CameraIcon, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { Camera, CameraResultType } from '@capacitor/camera'

interface ChatInputProps {
    threadId: string
    replyTo?: any
    onCancelReply?: () => void
}

export function ChatInput({ threadId, replyTo, onCancelReply }: ChatInputProps) {
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const uploadFile = async (file: File) => {
        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${threadId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('chat-images')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: publicUrlData } = supabase.storage
                .from('chat-images')
                .getPublicUrl(filePath)

            setImageUrl(publicUrlData.publicUrl)
            toast.success('Imagen subida')
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error('Error al subir la imagen')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (file) await uploadFile(file)
    }

    async function handleCamera() {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Uri
            })

            if (image.webPath) {
                const response = await fetch(image.webPath)
                const blob = await response.blob()
                const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' })
                await uploadFile(file)
            }
        } catch (error) {
            // User cancelled or error
            console.log('Camera error:', error)
        }
    }

    async function handleSend() {
        if ((!message.trim() && !imageUrl) || isUploading) return

        const currentMessage = message
        const currentImage = imageUrl

        setMessage('') // Optimistic clear
        setImageUrl(null)

        if (onCancelReply) onCancelReply()
        setIsSending(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            const { error } = await supabase
                .from('messages')
                .insert({
                    thread_id: threadId,
                    from_user: user.id,
                    body: currentMessage.trim(),
                    reply_to_id: replyTo?.id,
                    image_url: currentImage
                })

            if (error) throw error

            // Update thread last_message_at
            await supabase
                .from('threads')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', threadId)

        } catch (error: any) {
            console.error('ChatInput: Error sending message:', error)
            const errorMessage = error.message || 'Error al enviar mensaje'
            toast.error(errorMessage)
            setMessage(currentMessage) // Restore message on error
            setImageUrl(currentImage)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="w-full relative">
            {replyTo && (
                <div className="flex items-center justify-between p-2 mb-2 bg-muted/50 rounded-lg border border-border text-sm">
                    <div className="flex flex-col truncate pr-4">
                        <span className="font-medium text-xs text-primary">Respondiendo a</span>
                        <span className="truncate opacity-70">{replyTo.body}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={onCancelReply}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {imageUrl && (
                <div className="relative mb-2 inline-block">
                    <img src={imageUrl} alt="Preview" className="h-20 w-auto rounded-lg border border-border" />
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
                        onClick={() => setImageUrl(null)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            <div className="flex items-end gap-2 w-full">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                />

                {/* Camera Button - Serves as main media button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-[50px] w-[50px] shrink-0 rounded-full border border-input bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                        // User requested "keep only camera". 
                        // But usually this implies "Camera Icon" that might open options or just camera.
                        // I will wire it to open Camera directly as per existing logic.
                        // If they want gallery, they might need to long press or use camera UI's gallery picker if available.
                        // Or I can make this button open a sheet? 
                        // The user said: "hay 2 botones... uno cámara y otro foto (gallery)... deja solo el de la cámara".
                        // So I delete the gallery button.
                        handleCamera()
                    }}
                    disabled={isUploading}
                >
                    <CameraIcon className="h-5 w-5" />
                </Button>

                {/* Gallery Button REMOVED as per user request */}


                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe..."
                    className="min-h-[50px] max-h-[150px] resize-none bg-background/50 focus:bg-background transition-colors rounded-2xl py-3"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSend()
                        }
                    }}
                />
                <Button
                    onClick={handleSend}
                    disabled={(!message.trim() && !imageUrl) || isSending || isUploading}
                    size="icon"
                    className="h-[50px] w-[50px] shrink-0 rounded-full"
                >
                    <Send className="h-5 w-5" />
                </Button>
            </div>
        </div>
    )
}

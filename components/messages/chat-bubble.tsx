'use client'

import { cn } from '@/lib/utils'
import { formatMessageTime } from '@/lib/format'
import { CheckCheck, Euro, Check, X, Reply } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { respondToOffer } from '@/app/market/offer-actions'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { mediumHaptic } from '@/lib/haptics'
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { motion, PanInfo } from "framer-motion"

interface ChatBubbleProps {
    message: {
        id: string
        body: string
        created_at: string
        from_user: string
        read?: boolean
        type?: 'text' | 'offer'
        offer?: {
            id: string
            amount_cents: number
            status: 'pending' | 'accepted' | 'rejected'
        }
        thread_id: string
        reply_to?: {
            id: string
            body: string
            from_user: string
            image_url?: string
        }
        image_url?: string
        reactions?: Record<string, string>
    }
    isCurrentUser: boolean
    showTail?: boolean
    onReply?: (message: any) => void
    onScrollToMessage?: (messageId: string) => void
}

export function ChatBubble({ message, isCurrentUser, showTail = true, onReply, onScrollToMessage }: ChatBubbleProps) {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const [reactions, setReactions] = useState<Record<string, string>>(message.reactions || {})

    // Sync local state with prop updates
    useEffect(() => {
        setReactions(message.reactions || {})
    }, [message.reactions])

    const handleRespond = async (accept: boolean) => {
        if (!message.offer) return
        setLoading(true)
        try {
            await respondToOffer(message.offer.id, accept, message.thread_id)
            toast.success(accept ? 'Oferta aceptada' : 'Oferta rechazada')
        } catch (error) {
            toast.error('Error al responder a la oferta')
        } finally {
            setLoading(false)
        }
    }

    const handleReaction = async (emoji: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const currentReaction = reactions[user.id]
        const newReactions = { ...reactions }

        if (currentReaction === emoji) {
            delete newReactions[user.id]
        } else {
            newReactions[user.id] = emoji
        }

        setReactions(newReactions) // Optimistic update
        mediumHaptic()

        const { error } = await supabase
            .from('messages')
            .update({ reactions: newReactions })
            .eq('id', message.id)

        if (error) {
            setReactions(reactions) // Revert
            toast.error('Error al reaccionar')
        }
    }

    const onDragEnd = (event: any, info: PanInfo) => {
        if (info.offset.x > 50 && onReply) {
            mediumHaptic()
            onReply(message)
        }
    }

    if (message.type === 'offer' && message.offer) {
        // ... (Keep existing offer logic logic, slightly abbreviated for context limits if unmodified)
        const { amount_cents, status } = message.offer
        const amount = (amount_cents / 100).toFixed(2)

        return (
            <div className={cn(
                "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                isCurrentUser ? "justify-end" : "justify-start",
                showTail ? "mb-2" : "mb-1"
            )}>
                <div className={cn(
                    "max-w-[85%] rounded-xl p-3 text-sm shadow-sm relative overflow-hidden",
                    isCurrentUser
                        ? cn("bg-primary text-primary-foreground", showTail && "rounded-tr-none")
                        : cn("bg-muted/50 backdrop-blur-sm border border-white/10 text-foreground", showTail && "rounded-tl-none")
                )}>
                    {/* Offer Header */}
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <Euro className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="font-semibold text-base">{amount}€</p>
                            <p className="text-xs opacity-80">Contraoferta</p>
                        </div>
                    </div>

                    {/* Offer Status/Actions */}
                    <div className="space-y-2">
                        {status === 'pending' ? (
                            isCurrentUser ? (
                                <p className="text-xs opacity-80 italic">Esperando respuesta...</p>
                            ) : (
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/50"
                                        onClick={() => handleRespond(true)}
                                        disabled={loading}
                                    >
                                        <Check className="h-4 w-4 mr-1" /> Aceptar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50"
                                        onClick={() => handleRespond(false)}
                                        disabled={loading}
                                    >
                                        <X className="h-4 w-4 mr-1" /> Rechazar
                                    </Button>
                                </div>
                            )
                        ) : (
                            <div className={cn(
                                "text-xs font-medium px-2 py-1 rounded-md inline-block",
                                status === 'accepted' ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                            )}>
                                {status === 'accepted' ? 'Oferta aceptada' : 'Oferta rechazada'}
                            </div>
                        )}
                    </div>

                    <span className={cn(
                        "float-right ml-2 mt-1.5 align-bottom text-[10px] flex items-center gap-0.5 opacity-70 select-none h-3",
                        isCurrentUser ? "text-primary-foreground/90" : "text-muted-foreground"
                    )}>
                        {formatMessageTime(message.created_at)}
                        {isCurrentUser && (
                            <CheckCheck className={cn(
                                "h-3 w-3 transition-colors",
                                message.read ? "text-blue-500" : "text-current"
                            )} />
                        )}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div className={cn(
                    "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 relative group",
                    isCurrentUser ? "justify-end" : "justify-start",
                    showTail ? "mb-2" : "mb-1"
                )}>
                    {/* Desktop Reply Button (Left) */}
                    {isCurrentUser && onReply && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-full"
                                onClick={() => onReply && onReply(message)}
                            >
                                <Reply className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <motion.div
                        drag={!isCurrentUser ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={{ right: 0.1 }}
                        onDragEnd={onDragEnd}
                        className={cn("max-w-full relative", !isCurrentUser && "cursor-grab active:cursor-grabbing")}
                        whileDrag={{ x: 20 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                        <div className={cn(
                            "max-w-[80vw] sm:max-w-[350px] rounded-xl px-3 py-1.5 text-sm shadow-sm relative group/bubble",
                            isCurrentUser
                                ? cn("bg-primary text-primary-foreground", showTail && "rounded-tr-none")
                                : cn("bg-muted/50 backdrop-blur-sm border border-white/10 text-foreground", showTail && "rounded-tl-none")
                        )}>
                            {/* BUG FIX: Check message.reply_to.id exists */}
                            {message.reply_to && message.reply_to.id && (
                                <div
                                    className={cn(
                                        "mb-2 p-2 rounded bg-black/10 text-xs border-l-2 border-white/50 truncate max-w-full cursor-pointer hover:bg-black/20 transition-colors",
                                        isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (onScrollToMessage && message.reply_to?.id) {
                                            onScrollToMessage(message.reply_to.id)
                                        }
                                    }}
                                >
                                    <span className="font-semibold block opacity-70">Respuesta</span>
                                    {message.reply_to.image_url ? (
                                        <div className="flex items-center gap-1 mt-1">
                                            <img src={message.reply_to.image_url} alt="Imagen" className="h-8 w-8 object-cover rounded" />
                                            <span className="opacity-90 italic">Imagen</span>
                                        </div>
                                    ) : (
                                        <span className="opacity-90">{message.reply_to.body}</span>
                                    )}
                                </div>
                            )}

                            {message.image_url && (
                                <div className="mb-2 relative rounded-lg overflow-hidden max-w-full">
                                    <img
                                        src={message.image_url}
                                        alt="Imagen adjunta"
                                        className="max-h-[300px] w-auto object-contain rounded-lg bg-black/20"
                                        loading="lazy"
                                    />
                                </div>
                            )}

                            <span className="whitespace-pre-wrap leading-relaxed break-words">
                                {message.body}
                            </span>
                            <span className={cn(
                                "float-right ml-2 mt-1.5 align-bottom text-[10px] flex items-center gap-0.5 opacity-70 select-none h-3",
                                isCurrentUser ? "text-primary-foreground/90" : "text-muted-foreground"
                            )}>
                                {formatMessageTime(message.created_at)}
                                {isCurrentUser && (
                                    <CheckCheck className={cn(
                                        "h-3 w-3 transition-colors",
                                        message.read ? "text-blue-500" : "text-current"
                                    )} />
                                )}
                            </span>
                        </div>

                        {/* Reactions Display */}
                        {Object.keys(reactions).length > 0 && (
                            <div className={cn(
                                "absolute -bottom-3 flex gap-0.5 z-10",
                                isCurrentUser ? "right-0" : "left-0"
                            )}>
                                {Object.entries(reactions).map(([userId, emoji], i) => (
                                    <div key={`${userId}-${i}`} className="bg-background/90 border border-border/50 text-[10px] rounded-full px-1 py-0.5 shadow-sm animate-in zoom-in duration-200">
                                        {emoji}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Desktop Reply Button (Right) */}
                    {!isCurrentUser && onReply && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-full"
                                onClick={() => onReply && onReply(message)}
                            >
                                <Reply className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-48">
                <div className="flex justify-between p-2">
                    {['❤️', '😂', '😮', '😢', '😡', '👍'].map(emoji => (
                        <button
                            key={emoji}
                            className="hover:scale-125 transition-transform text-lg"
                            onClick={() => handleReaction(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
                <ContextMenuItem onClick={() => onReply && onReply(message)}>
                    <Reply className="mr-2 h-4 w-4" />
                    Responder
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}

'use client'

import { cn } from '@/lib/utils'
import { formatMessageTime } from '@/lib/format'
import { CheckCheck, Euro, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { respondToOffer } from '@/app/market/offer-actions'
import { toast } from 'sonner'

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
    }
    isCurrentUser: boolean
    showTail?: boolean
}

export function ChatBubble({ message, isCurrentUser, showTail = true }: ChatBubbleProps) {
    const [loading, setLoading] = useState(false)

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

    if (message.type === 'offer' && message.offer) {
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
        <div className={cn(
            "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
            isCurrentUser ? "justify-end" : "justify-start",
            showTail ? "mb-2" : "mb-1"
        )}>
            <div className={cn(
                "max-w-[80%] rounded-xl px-3 py-1.5 text-sm shadow-sm relative",
                isCurrentUser
                    ? cn("bg-primary text-primary-foreground", showTail && "rounded-tr-none")
                    : cn("bg-muted/50 backdrop-blur-sm border border-white/10 text-foreground", showTail && "rounded-tl-none")
            )}>
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
        </div>
    )
}

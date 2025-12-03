'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

const EMOJIS = ['❤️', '👍', '🔥', '😂', '😍']

interface ReactionPickerProps {
    targetType: 'post' | 'listing'
    targetId: string
    reactions: Record<string, { count: number; users: string[] }>
    currentUserId?: string
    className?: string
}

export function ReactionPicker({ targetType, targetId, reactions, currentUserId, className }: ReactionPickerProps) {
    const [isPending, startTransition] = useTransition()
    const [optimisticReactions, setOptimisticReactions] = useState(reactions)
    const supabase = createClient()

    const handleReaction = async (emoji: string) => {
        if (!currentUserId) return

        // Optimistic update
        setOptimisticReactions(prev => {
            const newReactions = { ...prev }
            const hasReacted = newReactions[emoji]?.users.includes(currentUserId)

            if (hasReacted) {
                // Remove reaction
                newReactions[emoji] = {
                    count: Math.max(0, (newReactions[emoji]?.count || 1) - 1),
                    users: newReactions[emoji].users.filter(id => id !== currentUserId)
                }
                if (newReactions[emoji].count === 0) {
                    delete newReactions[emoji]
                }
            } else {
                // Add reaction
                newReactions[emoji] = {
                    count: (newReactions[emoji]?.count || 0) + 1,
                    users: [...(newReactions[emoji]?.users || []), currentUserId]
                }
            }

            return newReactions
        })

        // Server interaction
        startTransition(async () => {
            try {
                // Check if reaction already exists
                const { data: existing } = await supabase
                    .from('reactions')
                    .select('id')
                    .eq('user_id', currentUserId)
                    .eq('target_type', targetType)
                    .eq('target_id', targetId)
                    .eq('emoji', emoji) // Need to check specific emoji if multiple allowed, or just target if one per user/target? 
                    // Assuming one emoji per user per target? Or multiple?
                    // The original action checked target_type and target_id but didn't filter by emoji for existence check?
                    // Wait, the original action:
                    // .eq('user_id', user.id)
                    // .eq('target_type', targetType)
                    // .eq('target_id', targetId)
                    // .single()
                    // This implies only ONE reaction per user per target (regardless of emoji).
                    // If so, toggling a different emoji would switch it? Or is it just a toggle?
                    // Let's assume the original logic was: if ANY reaction exists for this target/user, delete it. If not, insert the new one.
                    // But wait, if I click 'heart' then 'thumbs up', do I want both?
                    // The original code:
                    // if (existing) { delete } else { insert }
                    // It didn't check emoji in the existence query. So it seems it allows only ONE reaction per user per target.
                    // Let's stick to that logic.

                    .maybeSingle()

                if (existing) {
                    // If existing reaction is the SAME emoji, delete it (toggle off)
                    // If it's a DIFFERENT emoji, should we switch? 
                    // The original code deleted `existing.id`. It didn't check if `existing.emoji === emoji`.
                    // So clicking ANY emoji would remove the existing reaction.
                    // This means if I have ❤️ and click 👍, it removes ❤️. It doesn't add 👍.
                    // That seems like a "toggle" behavior where you can only have one reaction, but the UI suggests multiple buttons.
                    // If I click the SAME emoji, it should toggle off.
                    // If I click a DIFFERENT emoji, it should probably switch?
                    // The original code was:
                    // if (existing) { delete } else { insert }
                    // This means clicking ANY emoji when you already have one will REMOVE it.
                    // So to switch from ❤️ to 👍, you'd have to click 👍 (removes ❤️), then click 👍 again (adds 👍).
                    // That's a bit clunky but I'll replicate it for now to be safe, or improve it?
                    // Let's improve: check if existing emoji is same.

                    // Actually, let's fetch the emoji too.
                }

                // Let's refine the query to include emoji
                const { data: existingReaction } = await supabase
                    .from('reactions')
                    .select('id, emoji')
                    .eq('user_id', currentUserId)
                    .eq('target_type', targetType)
                    .eq('target_id', targetId)
                    .maybeSingle()

                if (existingReaction) {
                    if (existingReaction.emoji === emoji) {
                        // Same emoji: remove it (toggle off)
                        await supabase.from('reactions').delete().eq('id', existingReaction.id)
                    } else {
                        // Different emoji: update it (switch)
                        await supabase.from('reactions').update({ emoji }).eq('id', existingReaction.id)
                    }
                } else {
                    // No reaction: insert new one
                    await supabase.from('reactions').insert({
                        user_id: currentUserId,
                        target_type: targetType,
                        target_id: targetId,
                        emoji
                    })
                }

            } catch (error) {
                console.error('Error toggling reaction:', error)
                toast.error('Error al reaccionar')
                // Revert optimistic update? (Complex to do without refetching)
            }
        })
    }

    return (
        <div className={cn("flex items-center gap-2 flex-wrap", className)}>
            {EMOJIS.map(emoji => {
                const reaction = optimisticReactions[emoji]
                const hasReacted = currentUserId && reaction?.users.includes(currentUserId)
                const count = reaction?.count || 0

                return (
                    <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReaction(emoji)}
                        disabled={!currentUserId || isPending}
                        className={cn(
                            "h-8 px-2 text-sm",
                            hasReacted && "bg-primary/10 border border-primary/20"
                        )}
                    >
                        <span className="mr-1">{emoji}</span>
                        {count > 0 && <span className="text-xs">{count}</span>}
                    </Button>
                )
            })}
        </div>
    )
}

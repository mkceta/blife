'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BarChart3, Users, Trash2, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { formatRelativeTime } from '@/lib/format'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useQueryClient } from '@tanstack/react-query'
import { CACHE_KEYS } from '@/lib/cache-keys'

interface PollOption {
    id: string
    option_text: string
    vote_count: number
    option_order: number
}

interface Poll {
    id: string
    user_id: string
    question: string
    multiple_choice: boolean
    created_at: string
    total_votes: number
    user: {
        alias_inst: string
        avatar_url?: string
    }
}

interface PollCardProps {
    poll: Poll
    options: PollOption[]
    userVotes?: string[] // IDs de opciones votadas por el usuario
    currentUserId?: string
}

export function PollCard({ poll, options: initialOptions, userVotes = [], currentUserId }: PollCardProps) {
    const [options, setOptions] = useState(initialOptions)
    const [selectedOptions, setSelectedOptions] = useState<string[]>(userVotes)
    const [hasVoted, setHasVoted] = useState(userVotes.length > 0)
    const [isVoting, setIsVoting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleted, setIsDeleted] = useState(false)
    const [totalVotes, setTotalVotes] = useState(poll.total_votes)
    const supabase = createClient()
    const queryClient = useQueryClient()

    // Realtime updates
    useEffect(() => {
        const channel = supabase
            .channel(`poll:${poll.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'poll_options',
                filter: `poll_id=eq.${poll.id}`
            }, (payload: { eventType: string; new: { id: string; vote_count: number } }) => {
                if (payload.eventType === 'UPDATE') {
                    setOptions(prev => prev.map(opt =>
                        opt.id === payload.new.id
                            ? { ...opt, vote_count: payload.new.vote_count }
                            : opt
                    ))
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'polls',
                filter: `id=eq.${poll.id}`
            }, (payload: { new: { total_votes: number } }) => {
                setTotalVotes(payload.new.total_votes)
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'poll_votes',
                filter: `poll_id=eq.${poll.id}`
            }, (payload: { new: Record<string, unknown> }) => {
                console.log('🔄 New vote detected:', payload.new)

                const voteData = payload.new as { user_id: string; option_id: string }

                // Ignore own votes (already handled by optimistic update)
                if (voteData.user_id === currentUserId) {
                    console.log('⏭️ Skipping own vote (already updated optimistically)')
                    return
                }

                // Increment for other users' votes
                setOptions(prev => prev.map(opt =>
                    opt.id === voteData.option_id
                        ? { ...opt, vote_count: opt.vote_count + 1 }
                        : opt
                ))

                setTotalVotes(prev => prev + 1)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [poll.id, supabase])

    const handleVote = async () => {
        if (!currentUserId) {
            toast.error('Debes iniciar sesión para votar')
            return
        }

        if (selectedOptions.length === 0) {
            toast.error('Selecciona al menos una opción')
            return
        }

        setIsVoting(true)

        try {
            // Optimistic UI update - increment vote counts immediately
            const previousOptions = options
            const previousTotal = totalVotes

            setOptions(prev => prev.map(opt => {
                if (selectedOptions.includes(opt.id)) {
                    return { ...opt, vote_count: opt.vote_count + 1 }
                }
                return opt
            }))
            setTotalVotes(prev => prev + selectedOptions.length)
            setHasVoted(true)

            // Insert votes - DB triggers will handle counter updates atomically
            const votes = selectedOptions.map(optionId => ({
                poll_id: poll.id,
                option_id: optionId,
                user_id: currentUserId
            }))

            const { error } = await supabase
                .from('poll_votes')
                .insert(votes)

            if (error) {
                // Rollback optimistic update on error
                setOptions(previousOptions)
                setTotalVotes(previousTotal)
                setHasVoted(false)
                throw error
            }

            toast.success('Voto registrado')

        } catch (error: unknown) {
            console.error('Error voting:', error)
            const errorMessage = error instanceof Error ? error.message : String(error)
            const errorCode = typeof error === 'object' && error !== null && 'code' in error
                ? (error as { code: string }).code
                : undefined

            if (errorMessage.includes('Ya has votado')) {
                toast.error('Ya has votado en esta encuesta')
                setHasVoted(true)
            } else if (errorMessage.includes('duplicate') || errorCode === '23505') {
                toast.error('Ya has votado esta opción')
                setHasVoted(true)
            } else {
                toast.error('Error al votar: ' + errorMessage)
            }
        } finally {
            setIsVoting(false)
        }
    }

    const handleOptionToggle = (optionId: string) => {
        if (hasVoted) return

        if (poll.multiple_choice) {
            // Multiple choice: toggle
            setSelectedOptions(prev =>
                prev.includes(optionId)
                    ? prev.filter(id => id !== optionId)
                    : [...prev, optionId]
            )
        } else {
            // Single choice: replace
            setSelectedOptions([optionId])
        }
    }

    const getPercentage = (voteCount: number) => {
        if (totalVotes === 0) return 0
        return Math.round((voteCount / totalVotes) * 100)
    }

    const isSelected = (optionId: string) => selectedOptions.includes(optionId)

    const handleDelete = async () => {
        if (!confirm('¿Eliminar esta encuesta?')) return

        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('polls')
                .delete()
                .eq('id', poll.id)

            if (error) throw error

            // Mark as deleted for optimistic UI update
            setIsDeleted(true)
            toast.success('Encuesta eliminada')

            // Invalidate community queries to refresh the feed
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.community.all })
        } catch (error) {
            console.error('Error deleting poll:', error)
            toast.error('Error al eliminar encuesta')
            setIsDeleting(false)
        }
    }

    // Don't render if poll was deleted
    if (isDeleted) return null

    return (
        <div className="border border-border rounded-lg p-4 space-y-4 bg-card">
            {/* Header */}
            <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={poll.user.avatar_url} />
                    <AvatarFallback>{poll.user.alias_inst.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold">@{poll.user.alias_inst}</p>
                    <p className="text-sm text-muted-foreground">
                        {formatRelativeTime(poll.created_at)}
                    </p>
                </div>
                {currentUserId === poll.user_id && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isDeleting ? 'Eliminando...' : 'Eliminar'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                <BarChart3 className="h-5 w-5 text-primary" />
            </div>

            {/* Question */}
            <h3 className="font-semibold text-lg">{poll.question}</h3>

            {/* Options */}
            <div className="space-y-2">
                {options.sort((a, b) => a.option_order - b.option_order).map((option) => {
                    const percentage = getPercentage(option.vote_count)
                    const selected = isSelected(option.id)

                    return (
                        <motion.div
                            key={option.id}
                            whileTap={hasVoted ? {} : { scale: 0.98 }}
                            className="relative"
                        >
                            <button
                                type="button"
                                onClick={() => handleOptionToggle(option.id)}
                                disabled={hasVoted}
                                className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden ${hasVoted
                                    ? 'cursor-default'
                                    : 'cursor-pointer hover:border-primary'
                                    } ${selected && !hasVoted
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border'
                                    }`}
                            >
                                {/* Progress bar (only show after voting) */}
                                {hasVoted && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                        className="absolute inset-0 bg-primary/10 rounded-lg"
                                    />
                                )}

                                <div className="relative flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {!hasVoted && (
                                            poll.multiple_choice ? (
                                                <Checkbox checked={selected} className="pointer-events-none" />
                                            ) : (
                                                <div className={`w-4 h-4 rounded-full border-2 ${selected ? 'border-primary bg-primary' : 'border-muted-foreground'
                                                    }`}>
                                                    {selected && (
                                                        <div className="w-full h-full rounded-full bg-background scale-50" />
                                                    )}
                                                </div>
                                            )
                                        )}
                                        <span className="font-medium truncate">{option.option_text}</span>
                                    </div>

                                    {hasVoted && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-sm font-semibold text-primary">
                                                {percentage}%
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                ({option.vote_count})
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        </motion.div>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}</span>
                    {poll.multiple_choice && (
                        <span className="text-xs">• Múltiple selección</span>
                    )}
                </div>

                {!hasVoted && currentUserId && (
                    <Button
                        onClick={handleVote}
                        disabled={isVoting || selectedOptions.length === 0}
                        size="sm"
                    >
                        {isVoting ? 'Votando...' : 'Votar'}
                    </Button>
                )}
            </div>
        </div>
    )
}


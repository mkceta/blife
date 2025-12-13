'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const CATEGORIES = [
    { id: 'General', label: '🔥 General' },
    { id: 'Peticiones', label: '🙏 Peticiones' },
    { id: 'Fiesta', label: '🍻 Fiesta' },
    { id: 'Deporte', label: '⚽ Deporte' },
    { id: 'Eventos', label: '🎉 Eventos' },
    { id: 'Entradas', label: '🎟️ Entradas' },
    { id: 'Offtopic', label: '🤡 Offtopic' },
]

interface CreatePollProps {
    onSuccess?: () => void
    onCancel?: () => void
}

export function CreatePoll({ onSuccess, onCancel }: CreatePollProps) {
    const [question, setQuestion] = useState('')
    const [category, setCategory] = useState('General')
    const [options, setOptions] = useState(['', ''])
    const [multipleChoice, setMultipleChoice] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClient()
    const queryClient = useQueryClient()

    const addOption = () => {
        if (options.length < 5) {
            setOptions([...options, ''])
        } else {
            toast.error('Máximo 5 opciones')
        }
    }

    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index))
        } else {
            toast.error('Mínimo 2 opciones')
        }
    }

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options]
        newOptions[index] = value
        setOptions(newOptions)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validaciones
        if (!question.trim()) {
            toast.error('Escribe una pregunta')
            return
        }

        if (question.length < 3 || question.length > 200) {
            toast.error('La pregunta debe tener entre 3 y 200 caracteres')
            return
        }

        const validOptions = options.filter(opt => opt.trim().length > 0)
        if (validOptions.length < 2) {
            toast.error('Necesitas al menos 2 opciones')
            return
        }

        if (validOptions.some(opt => opt.length > 100)) {
            toast.error('Las opciones no pueden tener más de 100 caracteres')
            return
        }

        setIsSubmitting(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            // Crear encuesta
            const { data: poll, error: pollError } = await supabase
                .from('polls')
                .insert({
                    user_id: user.id,
                    question: question.trim(),
                    multiple_choice: multipleChoice,
                    category: category
                })
                .select()
                .single()

            if (pollError) throw pollError

            // Crear opciones
            const pollOptions = validOptions.map((option, index) => ({
                poll_id: poll.id,
                option_text: option.trim(),
                option_order: index
            }))

            const { error: optionsError } = await supabase
                .from('poll_options')
                .insert(pollOptions)

            if (optionsError) throw optionsError

            toast.success('Encuesta creada')

            // Invalidate polls cache to show new poll
            queryClient.invalidateQueries({ queryKey: ['polls'] })

            // Reset form
            setQuestion('')
            setOptions(['', ''])
            setMultipleChoice(false)

            if (onSuccess) onSuccess()

        } catch (error: any) {
            console.error('Error creating poll:', error)
            toast.error('Error al crear encuesta')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-border rounded-lg bg-card">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Crear Encuesta</h3>
                {onCancel && (
                    <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Pregunta */}
            <div className="space-y-2">
                <Label htmlFor="question">Pregunta</Label>
                <Input
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="¿Cuál es tu opinión sobre...?"
                    maxLength={200}
                    className="text-base"
                />
                <p className="text-xs text-muted-foreground text-right">
                    {question.length}/200
                </p>
            </div>

            {/* Categoría */}
            <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Opciones */}
            <div className="space-y-2">
                <Label>Opciones</Label>
                <AnimatePresence>
                    {options.map((option, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-2"
                        >
                            <Input
                                value={option}
                                onChange={(e) => updateOption(index, e.target.value)}
                                placeholder={`Opción ${index + 1}`}
                                maxLength={100}
                                className="flex-1"
                            />
                            {options.length > 2 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeOption(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {options.length < 5 && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        className="w-full"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir opción ({options.length}/5)
                    </Button>
                )}
            </div>

            {/* Múltiple selección */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="space-y-0.5">
                    <Label htmlFor="multiple" className="text-base">
                        Permitir múltiples respuestas
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Los usuarios podrán seleccionar varias opciones
                    </p>
                </div>
                <Switch
                    id="multiple"
                    checked={multipleChoice}
                    onCheckedChange={setMultipleChoice}
                />
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-2">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                        Cancelar
                    </Button>
                )}
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Creando...' : 'Crear Encuesta'}
                </Button>
            </div>
        </form>
    )
}

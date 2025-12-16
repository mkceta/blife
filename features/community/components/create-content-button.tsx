'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, MessageSquare, BarChart3 } from 'lucide-react'
import { CreatePoll } from './create-poll'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function CreateContentButton() {
    const [isPollDialogOpen, setIsPollDialogOpen] = useState(false)
    const router = useRouter()

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        className="fixed bottom-[8rem] right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 z-[60] hover:shadow-primary/25 md:bottom-10"
                        size="icon"
                    >
                        <Plus className="h-7 w-7" strokeWidth={3} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => router.push('/community/new')}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Crear Post
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsPollDialogOpen(true)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Crear Encuesta
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isPollDialogOpen} onOpenChange={setIsPollDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nueva Encuesta</DialogTitle>
                    </DialogHeader>
                    <CreatePoll
                        onSuccess={() => setIsPollDialogOpen(false)}
                        onCancel={() => setIsPollDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}

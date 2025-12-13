'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BarChart3 } from 'lucide-react'
import { CreatePoll } from './create-poll'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

export function CreatePollButton() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                size="lg"
                className="fixed bottom-24 right-4 md:bottom-6 md:right-6 rounded-full shadow-lg z-30 h-14 w-14 p-0"
            >
                <BarChart3 className="h-6 w-6" />
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nueva Encuesta</DialogTitle>
                    </DialogHeader>
                    <CreatePoll
                        onSuccess={() => setIsOpen(false)}
                        onCancel={() => setIsOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}

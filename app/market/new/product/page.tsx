import { ListingForm } from '@/components/market/listing-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProductPage() {
    return (
        <div className="flex flex-col h-[100dvh] bg-background">
            <div className="flex items-center gap-2 p-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b shrink-0 z-30 bg-background/80 backdrop-blur-md">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/market/new">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold">Vender Artículo</h1>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-y-contain">
                <div className="container max-w-md mx-auto p-4 pt-6">
                    <ListingForm />
                </div>
            </div>
        </div>
    )
}

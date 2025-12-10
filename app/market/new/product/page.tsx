import { ListingForm } from '@/components/market/listing-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProductPage() {
    return (
        <div className="container max-w-md mx-auto p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
            <div className="flex items-center gap-2 mb-6">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/market/new">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold">Vender Artículo</h1>
            </div>

            <ListingForm />
        </div>
    )
}

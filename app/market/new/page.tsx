import { Button } from '@/components/ui/button'
import { ChevronLeft, ShoppingBag, Home } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export default function NewListingSelectionPage() {
    return (
        <div className="container max-w-md mx-auto p-4 pt-[calc(1rem+env(safe-area-inset-top))] min-h-screen flex flex-col">
            <div className="flex items-center gap-2 mb-8">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/home/market">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold">¿Qué quieres publicar?</h1>
            </div>

            <div className="flex-1 flex flex-col gap-4">
                <Link href="/market/new/product" className="group">
                    <Card className="border-2 border-border hover:border-primary transition-colors cursor-pointer group-active:scale-[0.98] transition-transform">
                        <CardContent className="flex items-center p-6 gap-4">
                            <div className="bg-primary/10 p-4 rounded-full group-hover:bg-primary/20 transition-colors">
                                <ShoppingBag className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Artículo</h2>
                                <p className="text-sm text-muted-foreground">Ropa, muebles, electrónica...</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/flats/new" className="group">
                    <Card className="border-2 border-border hover:border-primary transition-colors cursor-pointer group-active:scale-[0.98] transition-transform">
                        <CardContent className="flex items-center p-6 gap-4">
                            <div className="bg-blue-500/10 p-4 rounded-full group-hover:bg-blue-500/20 transition-colors">
                                <Home className="h-8 w-8 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Piso o Habitación</h2>
                                <p className="text-sm text-muted-foreground">Alquiler completo o compartido</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="p-4 text-center text-xs text-muted-foreground">
                Elige la categoría correcta para llegar a más gente.
            </div>
        </div>
    )
}

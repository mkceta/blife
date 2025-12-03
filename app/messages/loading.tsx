import { Skeleton } from '@/components/ui/skeleton'

export default function MessagesLoading() {
    return (
        <div className="flex flex-col h-full bg-background/50 w-full">
            <div className="h-16 border-b border-border/50 flex items-center px-4 gap-3 shrink-0">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-hidden">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`flex w-full ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <Skeleton className={`h-12 w-[60%] rounded-lg ${i % 2 === 0 ? 'rounded-br-sm' : 'rounded-bl-sm'}`} />
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-border mt-auto">
                <Skeleton className="h-[50px] w-full rounded-md" />
            </div>
        </div>
    )
}

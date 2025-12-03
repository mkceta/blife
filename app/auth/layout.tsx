export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
            {/* Each auth page will have its own background gradient */}
            <div className="w-full max-w-md relative z-10">
                {children}
            </div>
        </div>
    )
}




'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/format'
import { CheckCircle, ChevronLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ReportActions } from '@/features/admin/components/report-actions'

// Report type definition
interface Report {
    id: string
    created_at: string
    reporter_id: string
    target_type: 'listing' | 'post' | 'user' | 'flat'
    target_id: string
    reason: string
    details?: string
    status: 'open' | 'resolved'
    reporter?: {
        alias_inst: string
        avatar_url?: string
    }
    targetInfo?: {
        id: string
        title?: string
        content?: string
        alias_inst?: string
        user?: { alias_inst: string }
    }
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }

            const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
            if (profile?.role !== 'admin') {
                router.push('/market')
                return
            }

            const { data: reportsData } = await supabase
                .from('reports')
                .select(`
                    *,
                    reporter:users!reporter_id(alias_inst, avatar_url)
                `)
                .order('created_at', { ascending: false })

            if (reportsData) {
                const enrichedReports = await Promise.all(
                    reportsData.map(async (report: Omit<Report, 'targetInfo'>) => {
                        let targetInfo = null

                        if (report.target_type === 'listing') {
                            const { data } = await supabase
                                .from('listings')
                                .select('id, title, user:users!listings_user_id_fkey(alias_inst)')
                                .eq('id', report.target_id)
                                .single()
                            targetInfo = data
                        } else if (report.target_type === 'post') {
                            const { data } = await supabase
                                .from('posts')
                                .select('id, content, user:users!posts_user_id_fkey(alias_inst)')
                                .eq('id', report.target_id)
                                .single()
                            targetInfo = data
                        } else if (report.target_type === 'user') {
                            const { data } = await supabase
                                .from('users')
                                .select('id, alias_inst')
                                .eq('id', report.target_id)
                                .single()
                            targetInfo = data
                        } else if (report.target_type === 'flat') {
                            const { data } = await supabase
                                .from('flats')
                                .select('id, title, user:users!flats_user_id_fkey(alias_inst)')
                                .eq('id', report.target_id)
                                .single()
                            targetInfo = data
                        }

                        return { ...report, targetInfo }
                    })
                )
                setReports(enrichedReports)
            }
            setLoading(false)
        }

        fetchData()
    }, [router, supabase])

    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando reportes...</div>

    return (
        <div className="p-6 pb-20 md:pb-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="hover:bg-white/10">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-primary shadow-glow-primary">
                        <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Moderación de Reportes</h1>
                </div>
            </div>

            <div className="rounded-xl border border-border/50 overflow-x-auto glass-strong">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-white/10 hover:bg-transparent">
                            <TableHead className="text-foreground font-semibold">Fecha</TableHead>
                            <TableHead className="text-foreground font-semibold">Reportado por</TableHead>
                            <TableHead className="text-foreground font-semibold">Tipo</TableHead>
                            <TableHead className="text-foreground font-semibold">Contenido Reportado</TableHead>
                            <TableHead className="text-foreground font-semibold">Motivo</TableHead>
                            <TableHead className="text-foreground font-semibold">Detalles</TableHead>
                            <TableHead className="text-foreground font-semibold">Estado</TableHead>
                            <TableHead className="text-right text-foreground font-semibold">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map((report) => (
                            <TableRow key={report.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <TableCell className="font-medium py-4">
                                    {formatRelativeTime(report.created_at)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7 border border-white/10">
                                            <AvatarImage src={report.reporter?.avatar_url} />
                                            <AvatarFallback className="text-xs">
                                                {report.reporter?.alias_inst?.substring(0, 2).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">@{report.reporter?.alias_inst || 'Desconocido'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="border-white/20">
                                        {report.target_type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {report.targetInfo ? (
                                        <div className="flex flex-col gap-1">
                                            {report.target_type === 'listing' && (
                                                <>
                                                    <Link href={`/market/product?id=${report.target_id}`} className="text-sm text-primary hover:underline truncate max-w-[200px]" title={report.targetInfo.title}>
                                                        {report.targetInfo.title}
                                                    </Link>
                                                    <Link href={`/user/profile?alias=${report.targetInfo.user?.alias_inst}`} className="text-xs text-muted-foreground hover:text-foreground">
                                                        @{report.targetInfo.user?.alias_inst}
                                                    </Link>
                                                </>
                                            )}
                                            {report.target_type === 'flat' && (
                                                <>
                                                    <Link href={`/flats/view?id=${report.target_id}`} className="text-sm text-primary hover:underline truncate max-w-[200px]" title={report.targetInfo.title}>
                                                        {report.targetInfo.title}
                                                    </Link>
                                                    <Link href={`/user/profile?alias=${report.targetInfo.user?.alias_inst}`} className="text-xs text-muted-foreground hover:text-foreground">
                                                        @{report.targetInfo.user?.alias_inst}
                                                    </Link>
                                                </>
                                            )}
                                            {report.target_type === 'post' && (
                                                <>
                                                    <Link href={`/community`} className="text-sm text-primary hover:underline truncate max-w-[200px]" title={report.targetInfo.content}>
                                                        {report.targetInfo.content?.substring(0, 50)}...
                                                    </Link>
                                                    <Link href={`/user/profile?alias=${report.targetInfo.user?.alias_inst}`} className="text-xs text-muted-foreground hover:text-foreground">
                                                        @{report.targetInfo.user?.alias_inst}
                                                    </Link>
                                                </>
                                            )}
                                            {report.target_type === 'user' && (
                                                <Link href={`/user/profile?alias=${report.targetInfo.alias_inst}`} className="text-sm text-primary hover:underline">
                                                    @{report.targetInfo.alias_inst}
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Contenido eliminado</span>
                                    )}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate" title={report.reason}>
                                    {report.reason}
                                </TableCell>
                                <TableCell className="max-w-[250px]" title={report.details || ''}>
                                    {report.details ? (
                                        <p className="text-sm text-muted-foreground line-clamp-2">{report.details}</p>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Sin detalles</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={report.status === 'open' ? 'destructive' : 'secondary'}
                                        className={report.status === 'open' ? 'shadow-glow-primary' : ''}
                                    >
                                        {report.status === 'open' ? 'Pendiente' : 'Resuelto'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <ReportActions reportId={report.id} status={report.status} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!reports || reports.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p>No hay reportes pendientes.</p>
                                    <p className="text-xs">¡Buen trabajo!</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

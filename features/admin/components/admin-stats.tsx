import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AdminStatsProps {
    stats: {
        usersCount: number
        listingsCount: number
        soldCount: number
        reportsCount: number
        flatsCount: number
        postsCount: number
        totalVolume?: number
    }
}

export function AdminStats({ stats }: AdminStatsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="gap-0">
                <CardHeader className="pt-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-3xl font-bold tracking-tight">{stats.usersCount}</div>
                    <p className="text-xs text-muted-foreground mt-1 pb-4">Total registrados</p>
                </CardContent>
            </Card>

            <Card className="gap-0">
                <CardHeader className="pt-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Mercadillo</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-3xl font-bold tracking-tight">{stats.listingsCount}</div>
                    <p className="text-xs text-muted-foreground mt-1 pb-4">Activos</p>
                </CardContent>
            </Card>

            <Card className="gap-0">
                <CardHeader className="pt-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Ventas</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-3xl font-bold tracking-tight">{stats.soldCount}</div>
                    <p className="text-xs text-muted-foreground mt-1 pb-4">Completadas</p>
                </CardContent>
            </Card>

            <Card className="gap-0">
                <CardHeader className="pt-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pisos</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-3xl font-bold tracking-tight">{stats.flatsCount}</div>
                    <p className="text-xs text-muted-foreground mt-1 pb-4">Disponibles</p>
                </CardContent>
            </Card>

            <Card className="gap-0">
                <CardHeader className="pt-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Posts</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-3xl font-bold tracking-tight">{stats.postsCount}</div>
                    <p className="text-xs text-muted-foreground mt-1 pb-4">Publicados</p>
                </CardContent>
            </Card>

            <Card className={`gap-0 ${stats.reportsCount > 0 ? "border-destructive/50 bg-destructive/5" : ""}`}>
                <CardHeader className="pt-4">
                    <CardTitle className={`text-sm font-medium ${stats.reportsCount > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        Reportes
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className={`text-3xl font-bold tracking-tight ${stats.reportsCount > 0 ? "text-destructive" : ""}`}>
                        {stats.reportsCount}
                    </div>
                    <p className={`text-xs mt-1 pb-4 ${stats.reportsCount > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {stats.reportsCount > 0 ? "Requiere atención" : "Todo en orden"}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

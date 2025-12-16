'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MoreHorizontal, Shield, Ban } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { banUser, unbanUser } from '@/app/admin/actions'
import { useRouter } from 'next/navigation'

interface User {
    id: string
    alias_inst?: string
    email?: string
    avatar_url?: string
    rating_avg?: number
    rating_count?: number
    role?: string
    is_banned?: boolean
    created_at: string
}

interface UserTableProps {
    users: User[]
}

export function UserTable({ users: initialUsers }: UserTableProps) {
    const [users, setUsers] = useState(initialUsers)
    const [search, setSearch] = useState('')
    const router = useRouter()

    const handleBan = async (userId: string) => {
        if (!confirm('¿Seguro que quieres banear a este usuario?')) return
        const result = await banUser(userId)
        if (result.error) toast.error('Error al banear')
        else {
            toast.success('Usuario baneado')
            router.refresh()
        }
    }

    const handleUnban = async (userId: string) => {
        if (!confirm('¿Seguro que quieres desbanear a este usuario?')) return
        const result = await unbanUser(userId)
        if (result.error) toast.error('Error al desbanear')
        else {
            toast.success('Usuario desbaneado')
            router.refresh()
        }
    }

    const filteredUsers = users.filter(user =>
        user.alias_inst?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar usuario..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 glass-strong border-white/10"
                    />
                </div>
            </div>

            <div className="rounded-xl border border-border/50 overflow-hidden glass-strong">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-white/10 hover:bg-transparent">
                            <TableHead className="text-foreground font-semibold">Usuario</TableHead>
                            <TableHead className="text-foreground font-semibold">Rol</TableHead>
                            <TableHead className="text-foreground font-semibold">Registro</TableHead>
                            <TableHead className="text-foreground font-semibold">Reputación</TableHead>
                            <TableHead className="text-right text-foreground font-semibold">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <TableCell className="flex items-center gap-3 py-4">
                                    <Avatar className="h-10 w-10 border-2 border-white/10">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback className="bg-gradient-primary text-white">
                                            {user.alias_inst?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">@{user.alias_inst}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {user.role === 'admin' ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-primary text-white shadow-glow-primary">
                                            <Shield className="h-3 w-3 mr-1" />
                                            Admin
                                        </span>
                                    ) : user.is_banned ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                                            <Ban className="h-3 w-3 mr-1" />
                                            Baneado
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">Usuario</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {formatDistanceToNow(new Date(user.created_at), { locale: es, addSuffix: true })}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-primary">{user.rating_avg?.toFixed(1) || '-'}</span>
                                        <span className="text-xs text-muted-foreground">({user.rating_count || 0})</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="hover:bg-white/10">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="glass-strong border-white/10">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                                                Copiar ID
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-white/10" />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => user.is_banned ? handleUnban(user.id) : handleBan(user.id)}>
                                                <Ban className="h-4 w-4 mr-2" />
                                                {user.is_banned ? 'Desbanear Usuario' : 'Banear Usuario'}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}


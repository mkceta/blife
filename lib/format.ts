// Utility function to get full university name from domain
export function getUniversityName(domain: string): string {
    const uniMap: Record<string, string> = {
        'udc.es': 'Universidade da Coruña',
        'udc.gal': 'Universidade da Coruña',
    }
    return uniMap[domain] || domain
}

// Format user alias without domain
export function formatUserAlias(alias: string | null | undefined): string {
    if (!alias) return 'Usuario'
    // Remove @domain if present
    return alias.split('@')[0]
}

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const relative = formatDistanceToNow(d, { locale: es, addSuffix: false })

    return relative
        .replace('alrededor de ', '')
        .replace('menos de un minuto', 'ahora')
        .replace('un minuto', '1 min')
        .replace(' minutos', ' min')
        .replace('una hora', '1 h')
        .replace(' horas', ' h')
        .replace('un día', '1 d')
        .replace(' días', ' d')
        .replace('un mes', '1 m')
        .replace(' meses', ' m')
        .replace('un año', '1 a')
        .replace(' años', ' a')
}

// Verbose version "Hace 2 horas" without "alrededor de"
export function formatTimeAgo(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const relative = formatDistanceToNow(d, { locale: es, addSuffix: true })
    return relative
        .replace('alrededor de ', '')
        .replace('sobre ', '') // Sometimes "sobre 1 año"
        .replace('casi ', '')
}

export function formatMessageTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount)
}

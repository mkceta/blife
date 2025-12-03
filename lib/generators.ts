const NOUNS = ['Gato', 'Perro', 'Leon', 'Tigre', 'Aguila', 'Dragon', 'Fenix', 'Lobo', 'Oso', 'Zorro', 'Buho', 'Halcon', 'Delfin', 'Tiburon', 'Panda', 'Koala', 'Canguro', 'Ciervo', 'Caballo', 'Toro', 'Lince', 'Puma', 'Mapache', 'Tejon', 'Castor', 'Nutria', 'Erizo', 'Topo', 'Liebre', 'Conejo']
const ADJECTIVES = ['Rapido', 'Fuerte', 'Astuto', 'Sabio', 'Valiente', 'Leal', 'Noble', 'Feroz', 'Agil', 'Veloz', 'Audaz', 'Tenaz', 'Sagaz', 'Brillante', 'Radiante', 'Genial', 'Epico', 'Legendario', 'Mistico', 'Cosmico', 'Solar', 'Lunar', 'Estelar', 'Galactico', 'Infinito', 'Eterno', 'Magico', 'Fantastico', 'Increible', 'Asombroso']

export function generateAnonymousAliases(count = 5): string[] {
    const aliases = new Set<string>()
    while (aliases.size < count) {
        const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
        const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
        const num = Math.floor(Math.random() * 999)
        aliases.add(`${noun}${adj}${num}`)
    }
    return Array.from(aliases)
}

export function generateInstitutionalAlias(email: string): string {
    if (!email || !email.includes('@')) return ''
    const localPart = email.split('@')[0]
    return `${localPart}@udc`
}

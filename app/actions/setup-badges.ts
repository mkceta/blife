'use server'

import { createAdminClient } from "@/lib/supabase-admin"

const BADGES = [
    { code: 'verified_udc', name: 'Verificado UDC', description: 'Cuenta verificada con correo institucional UDC', icon_name: 'ShieldCheck' },
    { code: 'pro_trader', name: 'Vendedor Pro', description: 'Ha vendido 5 o más artículos en el mercado', icon_name: 'Trophy' },
    { code: 'admin', name: 'Casero', description: 'Ayuda a los estudiantes a encontrar piso', icon_name: 'Key' },
    { code: 'first_sale', name: 'Primera Venta', description: '¡Felicidades por tu primera venta!', icon_name: 'Store' },
    { code: 'scholar', name: 'Erudito', description: 'Aporta material académico (libros y apuntes)', icon_name: 'BookOpen' },
    { code: 'techie', name: 'G33K', description: 'Vendedor de gadgets y electrónica', icon_name: 'Cpu' },
    { code: 'fashion', name: 'Swagger', description: 'Renueva su armario vendiendo ropa', icon_name: 'Shirt' },
    { code: 'five_stars', name: 'Impecable', description: 'Vendedor excelente con valoración media de 5 estrellas', icon_name: 'Star' },
    { code: 'early_bird', name: 'Pionero', description: 'Uno de los primeros 100 usuarios de Blife', icon_name: 'Rocket' },
    { code: 'influencer', name: 'Sinvergüenza', description: 'Usuario con perfil completo y foto establecida', icon_name: 'Crown' }
]

export async function setupBadgesSystem() {
    const supabase = createAdminClient()

    // 1. Seed Badges
    const { error: seedError } = await supabase
        .from('badges')
        .upsert(BADGES, { onConflict: 'code' })

    if (seedError) {
        console.error('Error seeding badges:', seedError)
        return { success: false, error: seedError.message }
    }

    // 2. Fetch all required data to evaluate badges
    // We need users, their listings, reviews (or ratings), etc.
    // Fetching everything might be heavy but for "updating old profiles" it's necessary.
    // We'll do it per user to be safer on memory, though slower.

    const { data: users, error: usersError } = await supabase.from('users').select('*')
    if (usersError) return { success: false, error: usersError.message }

    const { data: allBadges } = await supabase.from('badges').select('id, code')
    if (!allBadges) return { success: false, error: 'No badges found' }

    const badgeMap = allBadges.reduce((acc, b) => ({ ...acc, [b.code]: b.id }), {} as Record<string, string>)

    let awardedCount = 0

    for (const user of users) {
        const badgesToAward: string[] = []

        // 1. UDC Verified
        if (user.email?.includes('@udc.es') || user.email?.includes('@alumnado.udc.es') || user.uni === 'udc.es') {
            badgesToAward.push(badgeMap['verified_udc'])
        }

        // 2. Casero (Anteriormente Admin) - Logic: Has posted a flat
        const { count: flatsCount } = await supabase.from('flats').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        if ((flatsCount || 0) > 0) {
            badgesToAward.push(badgeMap['admin'])
        }

        // 3. Sinvergüenza (Influencer)
        if (user.avatar_url && user.alias_inst && user.alias_inst.length > 2) {
            badgesToAward.push(badgeMap['influencer'])
        }

        // 4. Early Bird (Everyone existing now)
        badgesToAward.push(badgeMap['early_bird'])

        // Fetch User Sales/Listings Stats
        // We use admin client so we can just count
        const { count: salesCount } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'sold')
        const { count: booksCount } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('category', 'LibrosApuntes')
        const { count: techCount } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('category', 'Electronica')
        const { count: fashionCount } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('category', 'Ropa')

        if ((salesCount || 0) >= 1) badgesToAward.push(badgeMap['first_sale'])
        if ((salesCount || 0) >= 5) badgesToAward.push(badgeMap['pro_trader'])
        if ((booksCount || 0) >= 1) badgesToAward.push(badgeMap['scholar'])
        if ((techCount || 0) >= 1) badgesToAward.push(badgeMap['techie'])
        if ((fashionCount || 0) >= 1) badgesToAward.push(badgeMap['fashion'])

        // 5 Stars
        if ((user.rating_avg || 0) >= 4.8 && (user.rating_count || 0) >= 3) {
            badgesToAward.push(badgeMap['five_stars'])
        }

        // Insert badges
        if (badgesToAward.length > 0) {
            const rows = badgesToAward.map(bid => ({
                user_id: user.id,
                badge_id: bid
            }))

            const { error: awardError } = await supabase
                .from('user_badges')
                .upsert(rows, { onConflict: 'user_id,badge_id' })

            if (!awardError) awardedCount += rows.length
        }
    }

    return { success: true, message: `Badges seeded and ${awardedCount} badges awarded to ${users.length} users.` }
}

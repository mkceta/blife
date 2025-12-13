# Sistema de Encuestas - Guía de Implementación

## ✅ Archivos Creados

1. **SQL Schema**: `create-polls-system.sql`
2. **Componentes**:
   - `components/community/create-poll.tsx` - Formulario para crear encuestas
   - `components/community/poll-card.tsx` - Tarjeta para mostrar y votar
   - `components/community/create-poll-button.tsx` - Botón flotante

## 📋 Pasos para Completar la Integración

### 1. Ejecutar SQL en Supabase
```bash
# Copia el contenido de create-polls-system.sql
# Pégalo en el SQL Editor de Supabase
# Ejecuta todo el script
```

### 2. Habilitar Realtime en Supabase Dashboard
```
Database → Replication → 
- Habilitar: polls
- Habilitar: poll_options
- Habilitar: poll_votes
```

### 3. Modificar CommunityFeedContent para Incluir Encuestas

Necesitas modificar `app/community/community-feed-content.tsx` para:

#### A. Fetch polls junto con posts:
```tsx
// Añadir al query de posts
const { data: polls } = await supabase
    .from('polls')
    .select(`
        *,
        user:users(alias_inst, avatar_url),
        options:poll_options(*),
        votes:poll_votes(option_id, user_id)
    `)
    .eq('category', currentCategory) // Si quieres filtrar por categoría
    .order('created_at', { ascending: false })
```

#### B. Combinar y ordenar posts y polls:
```tsx
const combinedFeed = [
    ...posts.map(p => ({ ...p, type: 'post' })),
    ...polls.map(p => ({ ...p, type: 'poll' }))
].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
```

#### C. Renderizar según tipo:
```tsx
{combinedFeed.map(item => 
    item.type === 'poll' ? (
        <PollCard
            key={item.id}
            poll={item}
            options={item.options}
            userVotes={item.votes
                .filter(v => v.user_id === currentUserId)
                .map(v => v.option_id)
            }
            currentUserId={currentUserId}
        />
    ) : (
        <PostCard key={item.id} post={item} {...otherProps} />
    )
)}
```

### 4. Añadir Categoría "Encuestas" (Opcional)

En `app/community/page.tsx`:
```tsx
const CATEGORIES = [
    // ... categorías existentes
    { id: 'Encuestas', label: '📊 Encuestas' },
]
```

## 🎨 Características Implementadas

✅ Límite de 1 encuesta por día por usuario
✅ Hasta 5 opciones por encuesta
✅ Single choice o multiple choice
✅ Actualización en tiempo real de votos
✅ Barras de progreso animadas
✅ Validación de votos duplicados
✅ Contador de votos totales
✅ UI estilo WhatsApp

## 🔧 Personalización

### Cambiar límite diario:
Edita la función `check_daily_poll_limit()` en el SQL

### Cambiar duración de encuestas:
```sql
expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
-- Cambia '7 days' por lo que quieras
```

### Añadir categorías a encuestas:
```sql
ALTER TABLE polls ADD COLUMN category TEXT;
```

## 🐛 Troubleshooting

### "Solo puedes crear 1 encuesta por día"
- Es el comportamiento esperado
- El límite se resetea a medianoche

### Los votos no se actualizan en tiempo real
- Verifica que Realtime esté habilitado en Supabase
- Revisa la consola del navegador

### Error al votar
- Verifica que el usuario esté autenticado
- Revisa las políticas RLS en Supabase

## 📊 Queries Útiles

### Ver todas las encuestas:
```sql
SELECT p.*, u.alias_inst, COUNT(pv.id) as total_votes
FROM polls p
JOIN users u ON p.user_id = u.id
LEFT JOIN poll_votes pv ON p.id = pv.poll_id
GROUP BY p.id, u.alias_inst
ORDER BY p.created_at DESC;
```

### Ver votos de un usuario:
```sql
SELECT p.question, po.option_text
FROM poll_votes pv
JOIN polls p ON pv.poll_id = p.id
JOIN poll_options po ON pv.option_id = po.id
WHERE pv.user_id = 'USER_ID_AQUI';
```

## 🚀 Próximos Pasos

1. Ejecutar SQL
2. Modificar CommunityFeedContent
3. Probar creación de encuestas
4. Probar votación
5. Verificar actualizaciones en tiempo real

¿Necesitas ayuda con algún paso? ¡Avísame!

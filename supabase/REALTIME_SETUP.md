# 📘 Guía: Configurar Realtime en Supabase

## Paso 1: Ejecutar la Migración SQL

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Click en **SQL Editor** en el menú lateral
3. Click en **New Query**
4. Copia y pega el contenido de `create_notifications_table.sql`
5. Click en **Run** (o presiona `Ctrl+Enter`)
6. Deberías ver: ✅ **Success. No rows returned**

---

## Paso 2: Habilitar Realtime para la Tabla

### Opción A: Desde el Dashboard (Recomendado)

1. En Supabase Dashboard, ve a **Database** → **Replication**
2. Busca la tabla `notifications` en la lista
3. Verás una columna "supabase_realtime"
4. **Toggle el switch a ON** (verde) para la tabla `notifications`
5. Espera unos segundos a que se aplique el cambio

![Ejemplo de cómo se ve](https://supabase.com/docs/img/database/replication.png)

### Opción B: Con SQL (Alternativa)

Si prefieres hacerlo con SQL, ejecuta esto en el SQL Editor:

```sql
-- Habilitar realtime para notifications
alter publication supabase_realtime add table notifications;
```

---

## Paso 3: Verificar que Funciona

### Test Rápido

1. Abre el SQL Editor
2. Ejecuta este query para crear una notificación de prueba:

```sql
-- Reemplaza 'TU_USER_ID' con tu user ID real
-- Puedes obtenerlo desde: select id from auth.users limit 1;

insert into notifications (user_id, type, title, message, link)
values (
    'TU_USER_ID',  -- Reemplaza esto
    'message',
    'Test',
    'Esta es una notificación de prueba',
    '/home'
);
```

3. Abre tu app en el navegador
4. Deberías ver aparecer la notificación instantáneamente sin recargar

---

## Paso 4: Obtener tu User ID

Si no sabes tu user ID, ejecuta esto en SQL Editor:

```sql
-- Ver todos los usuarios
select id, email from auth.users;
```

Copia el `id` de tu usuario.

---

## Troubleshooting

### ❌ "relation 'wishlist' does not exist"

**Solución:** Ya lo arreglé comentando el trigger de wishlist. Ejecuta la migración actualizada.

### ❌ No veo notificaciones en tiempo real

**Verifica:**
1. ✅ Realtime está habilitado para la tabla `notifications`
2. ✅ Estás autenticado en la app
3. ✅ Abriste la consola del navegador (F12) y no hay errores
4. ✅ El hook `useNotifications` se está ejecutando

**Debug:**
```javascript
// En la consola del navegador
localStorage.clear()
location.reload()
```

### ❌ Error: "permission denied for publication supabase_realtime"

**Solución:** Usa la Opción A (Dashboard) en lugar de SQL.

---

## Verificación Final

Ejecuta este query para confirmar que todo está bien:

```sql
-- Verificar que la tabla existe
select count(*) from notifications;

-- Verificar que los triggers existen
select tgname from pg_trigger where tgrelid = 'notifications'::regclass;

-- Verificar que las policies están activas
select schemaname, tablename, policyname 
from pg_policies 
where tablename = 'notifications';
```

Deberías ver:
- ✅ Count: 0 (o más si ya hay notificaciones)
- ✅ Triggers: ninguno (los triggers están en otras tablas)
- ✅ Policies: 4 policies (select, update, delete, insert)

---

## 🎉 ¡Listo!

Una vez completados estos pasos, el sistema de notificaciones en tiempo real estará 100% funcional.

**Prueba creando un comentario en un post de otro usuario y verás la notificación aparecer instantáneamente!**

# 🛠️ INSTALACIÓN DE SUPABASE CLI - Windows

## Método 1: PowerShell (Recomendado)

Abre PowerShell como Administrador y ejecuta:

```powershell
# Instalar Scoop primero (gestor de paquetes)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Luego instalar Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## Método 2: Descarga Directa (Más Rápido)

1. Ve a: https://github.com/supabase/cli/releases/latest
2. Descarga: `supabase_windows_amd64.zip` o `supabase_windows_arm64.zip`
3. Extrae el archivo `supabase.exe`
4. Muévelo a una carpeta en tu PATH (ej: `C:\Program Files\Supabase\`)
5. Añade esa carpeta al PATH de Windows:
   - Windows Search → "Variables de entorno"
   - Variables del sistema → Path → Editar → Nuevo
   - Pega: `C:\Program Files\Supabase`
   - OK → OK → OK
6. Cierra y reabre PowerShell/CMD

## Método 3: NPM Local (Si no funciona global)

```bash
# En el directorio del proyecto
npm install -D supabase

# Luego úsalo con npx
npx supabase db reset
npx supabase db push
```

## Verificar Instalación

```bash
supabase --version
# Debería mostrar algo como: 1.x.x
```

---

## 🎯 DESPUÉS DE INSTALAR

### 1. Iniciar Supabase Localmente (Opcional)

```bash
# Solo si quieres DB local para development
supabase init
supabase start
```

### 2. Conectar a tu Proyecto

```bash
# Link a tu proyecto de producción
supabase link --project-ref tu-proyecto-id

# Encuentra tu project-id en:
# https://supabase.com/dashboard/project/_/settings/general
```

### 3. Comandos Útiles

```bash
# Resetear DB local con todas las migraciones
supabase db reset

# Aplicar migraciones a producción
supabase db push --linked

# Ver diferencias entre local y producción
supabase db diff

# Crear nueva migración
supabase migration new nombre_de_migracion

# Ver lista de migraciones
supabase migration list
```

---

## ⚠️ ALTERNATIVA RÁPIDA

Si no quieres instalar Supabase CLI ahora, puedes:

1. **Aplicar migraciones manualmente** en Supabase Dashboard:
   - Ve a https://supabase.com/dashboard/project/_/sql/new
   - Copia y pega el contenido de cada archivo .sql
   - Ejecuta uno por uno en orden

2. **Usar npx** (ya está instalado npm):
   ```bash
   npx supabase@latest db reset
   ```

---

## 📋 ORDEN DE MIGRACIONES PENDIENTES

Ejecuta en este orden:

```bash
# 1. Poll triggers
npx supabase migration apply 20251216000000_fix_poll_triggers_atomic

# 2. Security fixes
npx supabase migration apply 20251216000001_emergency_security_fixes

# 3. Architecture fixes
npx supabase migration apply 20251216000002_critical_architecture_fixes
```

O todos a la vez:
```bash
npx supabase db reset  # Rebuild desde cero
```

---

## 🐛 SI SIGUES TENIENDO PROBLEMAS

El error que tuviste (`npm run dev` falla) ya lo arreglé:
- ✅ Cambié `@/lib/supabase` → `@/lib/supabase/client` en `theme-selector.tsx`

Prueba ahora:
```bash
npm run dev
```

Debería funcionar.

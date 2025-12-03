# BLife - Marketplace Universitario UDC

BLife es una aplicación móvil (PWA) para la compraventa de artículos entre estudiantes de la Universidade da Coruña (UDC).

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Postgres, Storage)
- **State**: React Query, Zustand (local)
- **Images**: browser-image-compression

## Setup

1. **Clonar el repositorio**
2. **Instalar dependencias**:
   ```bash
   npm install
   ```
3. **Configurar Variables de Entorno**:
   Crea un archivo `.env.local` con:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key # Solo para Admin API
   ```
4. **Base de Datos**:
   Ejecuta el script `supabase/schema.sql` en el SQL Editor de Supabase.
5. **Storage**:
   Crea un bucket público llamado `listings`.
6. **Correr en desarrollo**:
   ```bash
   npm run dev
   ```

## Credenciales Demo

Para probar la app, puedes registrarte con cualquier correo `@udc.es` (ej: `demo@udc.es`).
Para acceder al panel de Admin, debes cambiar el rol del usuario a `admin` en la tabla `users` de Supabase.

## Características
- **Auth Restringida**: Solo dominios UDC.
- **Alias**: Generación automática de alias institucional y anónimo.
- **Marketplace**: Subida de fotos comprimidas, feed, búsqueda.
- **Chat**: Mensajería en tiempo real entre comprador y vendedor.
- **Admin**: Dashboard de métricas y reportes.

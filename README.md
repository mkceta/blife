# 🎓 BLife - Marketplace Universitario UDC

<div align="center">

**Plataforma de compraventa y comunidad para estudiantes de la Universidade da Coruña**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green?logo=supabase)](https://supabase.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-7.4-blue?logo=capacitor)](https://capacitorjs.com/)

</div>

---

## 📱 Sobre el Proyecto

BLife es una aplicación móvil progresiva (PWA) diseñada específicamente para la comunidad estudiantil de la UDC. Combina un marketplace de segunda mano con funcionalidades sociales, permitiendo a los estudiantes comprar, vender y conectar de manera segura dentro del campus universitario.

### ✨ Características Principales

#### 🛍️ Marketplace
- **Publicación de artículos** con múltiples imágenes (compresión automática)
- **Búsqueda y filtrado** por categoría, precio, ubicación
- **Sistema de favoritos** para guardar artículos de interés
- **Mapa interactivo** para visualizar artículos cercanos
- **Integración con Stripe Connect** para pagos seguros

#### 💬 Mensajería en Tiempo Real
- **Chat privado** entre compradores y vendedores
- **Notificaciones push** nativas (Android)
- **Reacciones a mensajes** con feedback háptico
- **Respuestas a mensajes** (swipe-to-reply)
- **Envío de imágenes** desde cámara o galería
- **Indicadores de lectura** y estado de escritura

#### 👥 Comunidad
- **Feed social** con posts y encuestas
- **Sistema de votación** en tiempo real
- **Categorías de contenido** (General, Eventos, Dudas, Ofertas)
- **Interacción social** con likes y comentarios

#### 🔐 Autenticación Segura
- **Acceso exclusivo** para correos `@udc.es`
- **Verificación por código** enviado al email
- **Sistema de alias** (institucional y anónimo)
- **Gestión de perfiles** con foto y biografía

#### 🎨 Experiencia de Usuario
- **Diseño moderno** con animaciones fluidas
- **Modo oscuro/claro** personalizable
- **PWA instalable** en Android e iOS
- **Optimizado para móvil** con safe areas
- **Feedback háptico** en interacciones clave

#### 🛡️ Panel de Administración
- **Dashboard de métricas** (usuarios, ventas, actividad)
- **Gestión de reportes** y moderación
- **Estadísticas en tiempo real**
- **Control de usuarios** y contenido

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Lenguaje**: [TypeScript 5.9](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Componentes UI**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/)
- **Mapas**: [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/)

### Backend & Servicios
- **BaaS**: [Supabase](https://supabase.com/)
  - PostgreSQL Database
  - Authentication
  - Storage
  - Realtime Subscriptions
  - Edge Functions
- **Pagos**: [Stripe Connect](https://stripe.com/connect)
- **Analytics**: [Vercel Analytics](https://vercel.com/analytics)

### Mobile
- **Framework**: [Capacitor 7](https://capacitorjs.com/)
- **Plugins**:
  - Push Notifications
  - Local Notifications
  - Camera
  - Haptics
  - App

### Estado & Datos
- **Server State**: [TanStack Query (React Query)](https://tanstack.com/query)
- **Temas**: [next-themes](https://github.com/pacocoursey/next-themes)
- **Formularios**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

### Herramientas de Desarrollo
- **Linting**: ESLint
- **Testing**: Vitest + Testing Library
- **Compresión de Imágenes**: browser-image-compression
- **PWA**: Serwist (Service Worker)

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ y npm
- Cuenta de [Supabase](https://supabase.com/)
- Cuenta de [Stripe](https://stripe.com/) (para pagos)
- Android Studio (para desarrollo móvil Android)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/blife.git
cd blife
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=tu_stripe_publishable_key
STRIPE_SECRET_KEY=tu_stripe_secret_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configurar Supabase

#### Base de Datos

1. Ve al SQL Editor en tu proyecto de Supabase
2. Ejecuta el script de migración principal:
   ```bash
   # Ubicado en supabase/migrations/
   ```

#### Storage

1. Crea un bucket público llamado `listings`
2. Configura las políticas de acceso:
   - Lectura: Pública
   - Escritura: Solo usuarios autenticados

#### Edge Functions

Despliega las funciones necesarias:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Desplegar funciones
supabase functions deploy push-notification
supabase functions deploy stripe-webhook
```

### 5. Configurar Stripe Connect

1. Activa Stripe Connect en tu dashboard
2. Configura el webhook endpoint: `https://tu-proyecto.supabase.co/functions/v1/stripe-webhook`
3. Añade los eventos necesarios (ver documentación de Stripe)

### 6. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### 7. Build para Producción

#### Web (PWA)
```bash
npm run build
npm start
```

#### Android
```bash
# Build y sincronizar con Capacitor
npm run build:mobile

# Abrir en Android Studio
npx cap open android
```

---

## 📁 Estructura del Proyecto

```
blife/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Rutas de autenticación
│   ├── admin/               # Panel de administración
│   ├── community/           # Feed social y encuestas
│   ├── market/              # Marketplace
│   ├── messages/            # Sistema de mensajería
│   ├── profile/             # Perfiles de usuario
│   └── layout.tsx           # Layout principal
├── components/              # Componentes React
│   ├── ui/                  # Componentes UI base (shadcn)
│   ├── admin/               # Componentes del admin
│   ├── auth/                # Componentes de autenticación
│   ├── chat/                # Componentes de chat
│   ├── community/           # Componentes de comunidad
│   └── market/              # Componentes del marketplace
├── hooks/                   # Custom React Hooks
├── lib/                     # Utilidades y configuración
│   ├── supabase/           # Cliente de Supabase
│   ├── stripe/             # Configuración de Stripe
│   └── utils.ts            # Funciones auxiliares
├── public/                  # Archivos estáticos
├── supabase/               # Configuración de Supabase
│   ├── functions/          # Edge Functions
│   └── migrations/         # Migraciones SQL
├── android/                # Proyecto Capacitor Android
├── capacitor.config.ts     # Configuración de Capacitor
└── next.config.ts          # Configuración de Next.js
```

---

## 🗄️ Esquema de Base de Datos

### Tablas Principales

- **users**: Perfiles de usuario con alias y roles
- **listings**: Artículos del marketplace
- **messages**: Mensajes del chat
- **conversations**: Conversaciones entre usuarios
- **posts**: Publicaciones del feed social
- **polls**: Encuestas con opciones
- **poll_votes**: Votos en encuestas
- **notifications**: Sistema de notificaciones
- **favorites**: Artículos favoritos
- **orders**: Pedidos y transacciones

### Funcionalidades en Tiempo Real

- Mensajes nuevos en conversaciones
- Votos en encuestas
- Notificaciones push
- Estado de escritura en chat

---

## 🔑 Credenciales de Prueba

Para probar la aplicación:

1. **Registro**: Usa cualquier correo con dominio `@udc.es` (ej: `demo@udc.es`)
2. **Verificación**: Recibirás un código de 6 dígitos por email
3. **Acceso Admin**: Cambia el rol del usuario a `admin` en la tabla `users` de Supabase

---

## 📱 Instalación como PWA

### Android
1. Abre la app en Chrome
2. Toca el menú (⋮) → "Añadir a pantalla de inicio"
3. La app se instalará como aplicación nativa

### iOS
1. Abre la app en Safari
2. Toca el botón de compartir
3. Selecciona "Añadir a pantalla de inicio"

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👨‍💻 Autor

Desarrollado con ❤️ para la comunidad UDC

---

## 🐛 Reportar Bugs

Si encuentras algún bug o tienes sugerencias, por favor abre un [issue](https://github.com/mkceta/blife/issues).

---

## 📞 Soporte

Para soporte o preguntas, contacta a través de:
- Email: [marcos.alfonso.grandas@udc.es]
- GitHub Issues: [Crear issue](https://github.com/mkceta/blife/issues/new)

---

<div align="center">

**¿Te gusta el proyecto? Dale una ⭐ en GitHub!**

</div>


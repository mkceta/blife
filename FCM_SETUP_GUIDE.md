# 🔔 Firebase Cloud Messaging (FCM) Setup Guide

## ✅ Cambios Implementados

### 1. Nueva Tabla `user_devices` (1:N)
- ✅ Un usuario puede tener múltiples dispositivos
- ✅ Tokens únicos por dispositivo
- ✅ Limpieza automática de tokens inválidos
- ✅ Tracking de última actividad

### 2. Hook `useFcmToken` Mejorado
- ✅ Solo se ejecuta en plataformas nativas
- ✅ Manejo robusto de permisos
- ✅ Upsert para evitar duplicados
- ✅ Listeners para notificaciones en foreground/background

### 3. Edge Function Optimizado
- ✅ Envía a TODOS los dispositivos del usuario
- ✅ Limpia tokens inválidos automáticamente
- ✅ Configuración específica para Android/iOS
- ✅ Logging detallado para debugging

## 📋 Checklist de Configuración

### Android

#### 1. Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (o créalo)
3. Ve a **Project Settings** → **General**
4. En **Your apps**, añade una app Android si no existe
5. **Package name**: `com.blife.app` (debe coincidir con `capacitor.config.ts`)
6. Descarga `google-services.json`

#### 2. Colocar google-services.json
```bash
# Copia el archivo descargado a:
android/app/google-services.json
```

#### 3. Verificar AndroidManifest.xml
El archivo `android/app/src/main/AndroidManifest.xml` debe tener:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

#### 4. Sincronizar Capacitor
```bash
npm run cap:sync
```

### iOS (Si aplica)

#### 1. Firebase Console
1. En **Project Settings** → **General**
2. Añade una app iOS
3. **Bundle ID**: `com.blife.app`
4. Descarga `GoogleService-Info.plist`

#### 2. Colocar GoogleService-Info.plist
```bash
# Copia el archivo a:
ios/App/App/GoogleService-Info.plist
```

#### 3. Xcode Configuration
1. Abre `ios/App/App.xcworkspace` en Xcode
2. Selecciona el proyecto → **Signing & Capabilities**
3. Añade **Push Notifications**
4. Añade **Background Modes** → Marca **Remote notifications**

#### 4. Apple Developer Console
1. Ve a [Apple Developer](https://developer.apple.com/account/)
2. **Certificates, Identifiers & Profiles** → **Keys**
3. Crea una nueva Key con **Apple Push Notifications service (APNs)**
4. Descarga el archivo `.p8`
5. Sube esta key a Firebase Console:
   - **Project Settings** → **Cloud Messaging** → **iOS app configuration**
   - Sube el `.p8` y completa **Key ID** y **Team ID**

### Supabase Edge Function

#### 1. Obtener Service Account de Firebase
1. Firebase Console → **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Descarga el JSON

#### 2. Configurar en Supabase
```bash
# Copia el contenido del JSON y guárdalo como variable de entorno
supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"tu-proyecto",...}'
```

#### 3. Deploy Edge Function
```bash
supabase functions deploy push-notification
```

### Base de Datos

#### 1. Ejecutar Migración
```bash
# Aplica la migración para crear user_devices
supabase db push
```

O ejecuta manualmente el SQL en el Dashboard de Supabase.

## 🧪 Testing

### 1. Verificar Registro de Token
1. Abre la app en un dispositivo Android
2. Acepta los permisos de notificaciones
3. Verifica en Supabase Dashboard:
```sql
SELECT * FROM user_devices WHERE user_id = 'tu-user-id';
```

Deberías ver una fila con:
- `fcm_token`: Token largo de FCM
- `platform`: 'android'
- `last_active`: Timestamp reciente

### 2. Enviar Notificación de Prueba
En Supabase Dashboard, ejecuta:
```sql
SELECT * FROM push_notification(
  jsonb_build_object(
    'user_id', 'tu-user-id',
    'title', 'Prueba',
    'message', 'Esto es una prueba de notificación',
    'link', '/home'
  )
);
```

O desde el código:
```typescript
await supabase.functions.invoke('push-notification', {
  body: {
    record: {
      user_id: user.id,
      title: 'Prueba',
      message: 'Hola desde BLife!',
      link: '/messages'
    }
  }
})
```

### 3. Verificar en Dispositivo
- **App abierta**: Debería aparecer un toast (Sonner)
- **App en background**: Debería aparecer notificación del sistema
- **App cerrada**: Debería aparecer notificación del sistema

## 🐛 Troubleshooting

### "No FCM token" en logs
- ✅ Verifica que `google-services.json` esté en `android/app/`
- ✅ Ejecuta `npm run cap:sync`
- ✅ Reconstruye la app: `npx cap open android` → Build → Rebuild Project

### "Permission denied"
- ✅ Verifica `AndroidManifest.xml` tiene `POST_NOTIFICATIONS`
- ✅ En Android 13+, debes pedir permisos explícitamente (ya implementado en `useFcmToken`)

### "Invalid token" en Edge Function
- ✅ El token se limpia automáticamente de `user_devices`
- ✅ Reinstala la app para obtener un nuevo token

### Notificaciones no llegan
1. Verifica que el token esté en `user_devices`
2. Verifica logs del Edge Function en Supabase Dashboard
3. Verifica que `FIREBASE_SERVICE_ACCOUNT` esté configurado
4. Verifica que el proyecto de Firebase tenga Cloud Messaging habilitado

## 📊 Monitoreo

### Ver dispositivos activos
```sql
SELECT 
  u.alias_inst,
  d.platform,
  d.last_active,
  d.created_at
FROM user_devices d
JOIN users u ON u.id = d.user_id
ORDER BY d.last_active DESC;
```

### Limpiar dispositivos inactivos (>90 días)
```sql
SELECT cleanup_inactive_devices();
```

## ✅ Checklist Final

- [ ] `google-services.json` en `android/app/`
- [ ] Migración `user_devices` aplicada
- [ ] Edge Function desplegado
- [ ] `FIREBASE_SERVICE_ACCOUNT` configurado en Supabase
- [ ] App reconstruida con `npx cap sync`
- [ ] Permisos aceptados en dispositivo
- [ ] Token visible en tabla `user_devices`
- [ ] Notificación de prueba enviada y recibida

## 🎯 Próximos Pasos

1. **Integrar con eventos reales**: Cuando llegue un mensaje, llama al Edge Function
2. **Deep linking**: Usa el campo `data.url` para navegar al abrir la notificación
3. **Badge count**: Implementa contador de notificaciones no leídas
4. **Notificaciones programadas**: Usa `LocalNotifications` para recordatorios

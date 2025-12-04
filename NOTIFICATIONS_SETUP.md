# Configuración de Notificaciones Push (Segundo Plano)

Para que las notificaciones funcionen cuando la app está **cerrada o en segundo plano**, es necesario configurar Firebase Cloud Messaging (FCM) y una Edge Function en Supabase.

## 1. Configuración de Firebase (Android)

1. Ve a [Firebase Console](https://console.firebase.google.com/).
2. Crea un nuevo proyecto o usa uno existente.
3. Añade una aplicación **Android** con el nombre de paquete: `com.blife.app`.
4. Descarga el archivo `google-services.json`.
5. Coloca este archivo en la carpeta: `android/app/google-services.json`.

## 2. Configuración de Base de Datos

Ejecuta el siguiente SQL en tu panel de Supabase (SQL Editor) para añadir la columna necesaria para guardar los tokens de los dispositivos:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token text;
```

## 3. Desplegar Edge Function

Esta función se encargará de enviar la notificación a Google cuando haya una nueva notificación en la base de datos.

1. Asegúrate de tener instalado Supabase CLI.
2. Inicia sesión: `supabase login`.
3. Despliega la función:
   ```bash
   supabase functions deploy push-notification
   ```
4. Configura las variables de entorno para la función en el panel de Supabase (Edge Functions -> push-notification -> Secrets):
   - `FIREBASE_SERVICE_ACCOUNT`: El contenido del JSON de tu cuenta de servicio de Firebase (descárgalo desde Firebase Console -> Configuración del proyecto -> Cuentas de servicio).
   - `SUPABASE_URL`: Tu URL de Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: Tu clave `service_role` (no la anon key).

## 4. Configuración de Trigger

Ejecuta el SQL que se encuentra en `supabase/migrations/20251204_add_fcm_push.sql` para crear el trigger que llama a la función automáticamente.

---

Una vez completados estos pasos:
1. Reconstruye la app: `npx cap sync`.
2. Abre la app en tu móvil.
3. Ve a Perfil -> Editar -> Activar notificaciones.
4. Cierra la app.
5. Envía un mensaje o genera una notificación desde otro usuario.
6. ¡Deberías recibir la notificación en tu móvil!

# 🚀 Desplegar Edge Function - Push Notifications

## ⚠️ Importante
No tienes Supabase CLI instalado, así que usaremos el Dashboard.

## 📋 Pasos para Desplegar

### 1. Abrir Supabase Dashboard
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto **BLife**

### 2. Ir a Edge Functions
1. En el menú lateral izquierdo, busca **"Edge Functions"**
2. Click en **"Create a new function"**

### 3. Configurar la Función

**Name**: `push-notification`

**Code**: Copia TODO el código de abajo:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { JWT } from "https://esm.sh/google-auth-library@9"

// Load Firebase service account from environment
const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}')

serve(async (req) => {
    try {
        const { record } = await req.json()

        // Validate input
        if (!record?.user_id) {
            return new Response(
                JSON.stringify({ error: 'Missing user_id in record' }), 
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // Initialize Supabase client with service role
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get ALL active devices for this user
        const { data: devices, error: devicesError } = await supabase
            .from('user_devices')
            .select('id, fcm_token, platform')
            .eq('user_id', record.user_id)

        if (devicesError) {
            console.error('Error fetching devices:', devicesError)
            return new Response(
                JSON.stringify({ error: 'Failed to fetch user devices' }), 
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        }

        if (!devices || devices.length === 0) {
            console.log(`No devices found for user ${record.user_id}`)
            return new Response(
                JSON.stringify({ message: 'No devices registered for this user' }), 
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Found ${devices.length} device(s) for user ${record.user_id}`)

        // 2. Get Access Token from Google Service Account
        const jwtClient = new JWT({
            email: serviceAccount.client_email,
            key: serviceAccount.private_key,
            scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        })
        
        const tokens = await jwtClient.authorize()
        const accessToken = tokens.access_token

        if (!accessToken) {
            throw new Error('Failed to get Firebase access token')
        }

        // 3. Send notification to ALL devices
        const results = []
        const invalidTokens = []

        for (const device of devices) {
            try {
                const res = await fetch(
                    `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({
                            message: {
                                token: device.fcm_token,
                                notification: {
                                    title: record.title || 'BLife',
                                    body: record.message || 'Tienes una nueva notificación',
                                },
                                data: {
                                    url: record.link || '/',
                                    notification_id: record.id || '',
                                    type: record.type || 'general'
                                },
                                android: {
                                    priority: 'high',
                                    notification: {
                                        sound: 'default',
                                        click_action: 'FLUTTER_NOTIFICATION_CLICK'
                                    }
                                },
                                apns: {
                                    payload: {
                                        aps: {
                                            sound: 'default',
                                            badge: 1
                                        }
                                    }
                                }
                            },
                        }),
                    }
                )

                const data = await res.json()

                if (!res.ok) {
                    console.error(`FCM error for device ${device.id}:`, data)
                    
                    if (
                        data.error?.code === 404 || 
                        data.error?.status === 'NOT_FOUND' ||
                        data.error?.status === 'UNREGISTERED' ||
                        data.error?.message?.includes('not a valid FCM registration token')
                    ) {
                        console.log(`Marking device ${device.id} for deletion (invalid token)`)
                        invalidTokens.push(device.id)
                    }
                    
                    results.push({ 
                        device_id: device.id, 
                        platform: device.platform,
                        success: false, 
                        error: data.error 
                    })
                } else {
                    console.log(`✅ Notification sent to device ${device.id} (${device.platform})`)
                    results.push({ 
                        device_id: device.id, 
                        platform: device.platform,
                        success: true 
                    })
                }
            } catch (error) {
                console.error(`Exception sending to device ${device.id}:`, error)
                results.push({ 
                    device_id: device.id, 
                    platform: device.platform,
                    success: false, 
                    error: error.message 
                })
            }
        }

        // 4. Clean up invalid tokens
        if (invalidTokens.length > 0) {
            console.log(`Deleting ${invalidTokens.length} invalid device(s)`)
            const { error: deleteError } = await supabase
                .from('user_devices')
                .delete()
                .in('id', invalidTokens)

            if (deleteError) {
                console.error('Error deleting invalid devices:', deleteError)
            } else {
                console.log(`✅ Cleaned up ${invalidTokens.length} invalid device(s)`)
            }
        }

        // 5. Return summary
        const successCount = results.filter(r => r.success).length
        return new Response(
            JSON.stringify({
                success: true,
                sent_to: successCount,
                total_devices: devices.length,
                invalid_tokens_removed: invalidTokens.length,
                results: results
            }), 
            { 
                status: 200, 
                headers: { 'Content-Type': 'application/json' } 
            }
        )

    } catch (error) {
        console.error('Push notification error:', error)
        return new Response(
            JSON.stringify({ 
                success: false,
                error: error.message 
            }), 
            { 
                status: 500, 
                headers: { 'Content-Type': 'application/json' } 
            }
        )
    }
})
```

### 4. Deploy
1. Click en **"Deploy function"**
2. Espera a que termine (puede tardar 1-2 minutos)
3. Verás un mensaje de éxito

### 5. Configurar Firebase Service Account

**IMPORTANTE**: La función necesita el Service Account de Firebase.

1. **Firebase Console**:
   - Ve a: https://console.firebase.google.com/
   - Selecciona tu proyecto
   - **Project Settings** (⚙️) → **Service accounts**
   - Click en **"Generate new private key"**
   - Descarga el archivo JSON

2. **Supabase Secrets**:
   - En Supabase Dashboard → **Edge Functions** → **Manage secrets**
   - Click en **"Add secret"**
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: Pega TODO el contenido del JSON descargado
   - Click en **"Save"**

### 6. Verificar

Para verificar que funciona:

1. En Supabase Dashboard → **Edge Functions**
2. Selecciona `push-notification`
3. Ve a la pestaña **"Logs"**
4. Envía una notificación de prueba desde la app
5. Deberías ver logs aquí

## 🧪 Testing

Una vez desplegado:

1. Abre la app en Android
2. Ve a **Perfil** → **🧪 Test FCM**
3. Click en **"Enviar Push Notification"**
4. Deberías recibir la notificación
5. Si falla, revisa los logs en Supabase Dashboard

## ⚠️ Troubleshooting

### "Failed to send a request to the Edge Function"
- Verifica que la función esté desplegada
- Verifica que el nombre sea exactamente `push-notification`

### "Failed to get Firebase access token"
- Verifica que `FIREBASE_SERVICE_ACCOUNT` esté configurado
- Verifica que el JSON sea válido

### "No devices registered"
- Verifica que la tabla `user_devices` exista
- Verifica que haya al menos un token guardado

## 📝 Alternativa: Notificaciones Locales

Si no quieres configurar todo esto ahora, usa las **Notificaciones Locales** en la app:
- No requieren Edge Function
- No requieren Firebase
- Funcionan inmediatamente
- Perfectas para testing

Click en **"Enviar Notificación Local"** en la página de test.

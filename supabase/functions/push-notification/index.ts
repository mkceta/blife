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
                                // Android specific config
                                android: {
                                    priority: 'high',
                                    notification: {
                                        sound: 'default',
                                        click_action: 'FLUTTER_NOTIFICATION_CLICK'
                                    }
                                },
                                // iOS specific config
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

                    // Check if token is invalid/unregistered
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

        // 4. Clean up invalid tokens from database
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

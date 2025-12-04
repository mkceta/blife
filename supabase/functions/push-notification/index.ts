import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { JWT } from "https://esm.sh/google-auth-library@9"

// Load service account from env
const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}')

serve(async (req) => {
    try {
        const { record } = await req.json()

        // 1. Get the user's FCM token
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: user } = await supabase
            .from('users')
            .select('fcm_token')
            .eq('id', record.user_id)
            .single()

        if (!user?.fcm_token) {
            return new Response(JSON.stringify({ message: 'No FCM token for user' }), { status: 200 })
        }

        // 2. Get Access Token from Google Service Account
        const jwtClient = new JWT({
            email: serviceAccount.client_email,
            key: serviceAccount.private_key,
            scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        })
        const tokens = await jwtClient.authorize()
        const accessToken = tokens.access_token

        // 3. Send to FCM
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
                        token: user.fcm_token,
                        notification: {
                            title: 'BLife',
                            body: record.message || 'Tienes una nueva notificación',
                        },
                        data: {
                            url: record.link || '/',
                            notification_id: record.id
                        }
                    },
                }),
            }
        )

        const data = await res.json()
        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})

import { createClient } from 'npm:@supabase/supabase-js@2';
import { JWT } from 'npm:google-auth-library@9';

import serviceAccount from '../service-account.json' with { type: 'json' };

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

export async function sendNotification(notification: NotificationSupabase) {
    const { data } = await supabase
    .from('user_fcm')
    .select('fcm')
    .eq('user_id', notification.recipientId)
    .single()

    if (!data || !data.fcm) {
        throw new Error(`No FCM token found for user ${notification.recipientId}`);
    }

    const fcmToken = data!.fcm as string
    const notificationData = {
        ...notification.data,
        notificationKey: notification.notificationKey
    }

    const accessToken = await getAccessToken({
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
    })

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
                token: fcmToken,
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                data: notificationData
            },
        }),
        }
    )

    const resData = await res.json()
    if (res.status < 200 || 299 < res.status) {
        throw resData
    }
    }


    const getAccessToken = ({
    clientEmail,
    privateKey,
    }: {
    clientEmail: string
    privateKey: string
    }): Promise<string> => {
    return new Promise((resolve, reject) => {
        const jwtClient = new JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        })
        jwtClient.authorize((err, tokens) => {
        if (err) {
            reject(err)
            return
        }
        resolve(tokens!.access_token!)
        })
    })
}
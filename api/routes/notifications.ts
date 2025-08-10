import { Router } from 'express';
import { notificationBaseSchema, notificationSupabaseSchema } from '../../types/notifications/notification';
import supabase from '../services/supabase';
import { AuthenticatedRequest, authenticateFirebaseToken } from './middleware/firebaseAuth';

const router = Router();

router.get('/', async (_, res): Promise<any> => {
    return res.status(200).json({ message: 'Notification service is running' });
});

// Apply middleware to all routes in this group
router.use(authenticateFirebaseToken);


// Store or update FCM token for a user
router.post('/fcm', async (req: AuthenticatedRequest, res): Promise<any> => {
    const { user } = req;
    const { fcmToken } = req.body;
    if (!user || !fcmToken) {
        return res.status(400).json({ message: 'Missing user or FCM token' });
    }

    // Store or update the FCM token in the database
    const { error } = await supabase
        .from('user_fcm')
        .upsert({ user_id: user.uid, fcm: fcmToken });

    if (error) {
        console.error('Error storing FCM token:', error);
        return res.status(500).json({ message: 'Failed to store FCM token' });
    }

    return res.status(200).json({ message: 'FCM token stored successfully' });
});

// Store a notification for a user
router.post('/schedule', async (req: AuthenticatedRequest, res): Promise<any> => {
    const { user } = req;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const notificationData = notificationBaseSchema.safeParse(req.body);
    if (!notificationData.success) {
        return res.status(400).json({ errors: notificationData.error.errors });
    }

    // Validate notification data
    const parsedData = notificationBaseSchema.parse(notificationData.data);

    // Create notification record
    const notificationRecord = notificationSupabaseSchema.parse({
        ...parsedData,
        authorId: user.uid,
    });

    // Drop all notifications that are not sent with the same notification key
    await supabase
        .from('notifications')
        .delete()
        .eq('notificationKey', notificationRecord.notificationKey)
        .eq('sent', false);

    const { error } = await supabase
        .from('notifications')
        .insert(notificationRecord);

    if (error) {
        console.error('Error storing notification:', error);
        return res.status(500).json({ message: 'Failed to store notification' });
    }

    return res.status(201).json({ message: 'Notification stored successfully', data: notificationRecord });
});

// Cancel a notification by its key and recipient
router.delete('/cancel/:notificationKey/:recipientId', async (req: AuthenticatedRequest, res): Promise<any> => {
    const { user } = req;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const { notificationKey, recipientId } = req.params;
    if (!notificationKey || !recipientId) {
        return res.status(400).json({ message: 'Missing notification key or recipientId' });
    }
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('notificationKey', notificationKey)
        .eq('recipientId', recipientId)
        .eq('sent', false);

    if (error) {
        console.error('Error canceling notification:', error);
        return res.status(500).json({ message: 'Failed to cancel notification' });
    }

    return res.status(200).json({ message: 'Notification canceled successfully' });
});

export default router;

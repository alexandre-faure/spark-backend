import { v4 as uuid } from 'uuid';
import { z } from 'zod';

export const notificationBaseSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    body: z.string().min(1, 'Body is required'),
    recipientId: z.string().min(1, 'Recipient ID is required'),
    notificationKey: z.string().min(1, 'Notification key is required'),
    data: z.record(z.any()),
    sendAt: z.string().default(() => new Date().toISOString()),
});

export type NotificationBase = z.infer<typeof notificationBaseSchema>;

export const notificationSupabaseSchema = notificationBaseSchema.extend({
    id: z.string().uuid().default(() => uuid()),
    createdAt: z.string().default(() => new Date().toISOString()),
    sent: z.boolean().default(false),
});

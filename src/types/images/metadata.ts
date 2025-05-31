import { z } from 'zod';

export const imageMetadataSchema = z.object({
    createdAt: z.string().datetime().default(
        () => new Date().toISOString()
    ),
    authorId: z.string().optional(),
    groupId: z.string().optional(),
});

export type ImageMetadata = z.infer<typeof imageMetadataSchema>;
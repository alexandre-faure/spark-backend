import { z } from 'zod';

export const imageMetadataSchema = z.object({
    filename: z.string(),
    createdAt: z.string().datetime().default(
        () => new Date().toISOString()
    ),
    authorId: z.string().optional(),
    groupId: z.string().optional(),
});

export const createImageMetadataSchema = imageMetadataSchema.omit({
    filename: true,
    createdAt: true,
    authorId: true,
})

export type ImageMetadata = z.infer<typeof imageMetadataSchema>;
export type CreateImageMetadata = z.infer<typeof createImageMetadataSchema>;
import { z } from 'zod';
import { imageMetadataSchema } from './metadata';

export const imagePostResponseSchema = z.object({
    filename: z.string(),
    metadata: imageMetadataSchema,
    url: z.string(),
});

export type ImagePostResponse = z.infer<typeof imagePostResponseSchema>;
import { z } from 'zod';
import { v4 as uuid } from 'uuid'
import { compressToTargetSize } from '../../utils/images/compress';
import { imageMetadataSchema } from './metadata';

export const imagePostResponseSchema = z.object({
    filename: z.string(),
    metadata: imageMetadataSchema,
    url: z.string(),
});

export type ImagePostResponse = z.infer<typeof imagePostResponseSchema>;
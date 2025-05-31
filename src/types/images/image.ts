import { z } from 'zod';
import { v4 as uuid } from 'uuid'
import { compressToTargetSize } from '../../utils/images/compress';
import { imageMetadataSchema } from './metadata';

const MB_BYTES = 5 * 1024 * 1024; // 5 MB in bytes

const imageContentSchema = z.instanceof(File).superRefine((f, ctx) => {
    // First, add an issue if the mime type is wrong.
    if (!f.type.startsWith("image/")) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `File must be an image, got ${f.type}`,
        });
    }
    // Next add an issue if the file size is too large.
    if (f.size > 3 * MB_BYTES) {
        // Diminish image quality
        const newImageBuffer = compressToTargetSize(f, 3 * 1024, 'jpeg')
            .then(buffer => {
                f = new File([buffer], f.name, { type: "image/jpeg" });
            })
            .catch(err => {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Failed to compress image: ${err.message}`,
                });
            });
    }
}).transform((f) => {
    // Convert File to Blob for easier handling
    return new Blob([f], { type: f.type });
})


export const imageSchema = z.object({
    filename: z.string().default(() => uuid()),
    content: imageContentSchema,
    metadata: imageMetadataSchema
})

export type Image = z.infer<typeof imageSchema>;
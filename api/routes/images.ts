import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { IMAGES_BUCKET, IMAGES_METADATA_DB } from '../config/constants';
import { firebaseDb } from '../services/firebase';
import supabase from '../services/supabase';
import { ImagePostResponse } from '../types/images/image';
import { imageMetadataSchema } from '../types/images/metadata';
import { compressToTargetSize } from '../utils/images/compress';
import { AuthenticatedRequest, authenticateFirebaseToken } from './middleware/firebaseAuth';
import { upload } from './middleware/upload';

const router = Router();

// Apply middleware to all routes in this group
router.use(authenticateFirebaseToken);

router.get('/', async (req: AuthenticatedRequest, res): Promise<any> => {
    const { imagePath } = req.params;

    const { data } = supabase
        .storage
        .from(IMAGES_BUCKET).getPublicUrl(imagePath);

    return res.status(200).json(data.publicUrl);
});

router.get('/:imagePath', async (req: AuthenticatedRequest, res): Promise<any> => {
    const { imagePath } = req.params;

    const { data } = supabase
        .storage
        .from(IMAGES_BUCKET).getPublicUrl(imagePath);

    return res.status(200).json(data.publicUrl);
});

router.post('/', upload.single('content'), async (req: AuthenticatedRequest, res): Promise<any> => {
    try {
        const { user } = req;
        const { uid: authorId } = user!;

        const { metadata: rawMetadata } = req.body;
        const file = req.file;

        // Validate file
        if (!file || !file.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: 'Invalid or missing image file' });
        }

        // Generate unique filename
        const fileUuid = uuid();
        const filename = `${fileUuid}.${file.mimetype.split('/')[1]}`;

        // Validate metadata
        const metadata = imageMetadataSchema.parse({ ...JSON.parse(rawMetadata), authorId, filename });

        // Compress image to target size
        const format = file.mimetype.includes('png') ? 'png' : 'jpeg';
        const compressedBuffer = await compressToTargetSize(file.buffer, format);

        // Upload image to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(IMAGES_BUCKET)
            .upload(filename, compressedBuffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (uploadError) {
            console.error(uploadError);
            return res.status(500).json({ message: 'Failed to upload image' });
        }

        // Store metadata in Supabase table or your DB
        await firebaseDb.collection(IMAGES_METADATA_DB).doc(fileUuid).set({
            ...metadata,
            filename,
        });

        // Prepare response
        const response: ImagePostResponse = {
            filename,
            metadata: {
                ...metadata,
                createdAt: new Date().toISOString(),
            },
            url: supabase.storage.from(IMAGES_BUCKET).getPublicUrl(filename).data.publicUrl,
        };

        return res.status(201).json(response);
    } catch (err: any) {
        console.error(err);
        return res.status(400).json({ message: err.message || 'Invalid request' });
    }
});

router.delete('/:filename', authenticateFirebaseToken, async (req: AuthenticatedRequest, res): Promise<any> => {
    const { filename } = req.params;

    if (!filename) {
        return res.status(400).json({ message: 'Missing filename in request' });
    }

    try {
        const { error: storageError } = await supabase.storage
            .from(IMAGES_BUCKET)
            .remove([filename]);

        if (storageError) {
            console.error('Error deleting image from Supabase:', storageError);
            return res.status(500).json({ message: 'Failed to delete image from storage' });
        }

        await firebaseDb.collection(IMAGES_METADATA_DB).doc(filename).delete();

        return res.status(200).json({ message: 'Image and metadata deleted successfully' });
    } catch (error: any) {
        console.error('Deletion error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});


export default router;

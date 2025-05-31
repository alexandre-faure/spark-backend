import { Router } from 'express';
import { AuthenticatedRequest, authenticateFirebaseToken } from '../middleware/firebaseAuth';
import { imageMetadataSchema } from '../../types/images/metadata';

const router = Router();

// Apply middleware to all routes in this group
router.use(authenticateFirebaseToken);

router.get('/:filename', (req, res) => {
    const { filename } = req.params;
    res.json({ message: `Get image: ${filename}` });
});

router.post('/', async (req: AuthenticatedRequest, res): Promise<any> => {
    // const { uid } = req.user;
    const { content, metadata: _metadata } = req.body;
    const metadata = imageMetadataSchema.parse(_metadata);
    if (!content || !content) {
        return res.status(400).json({ message: 'Filename and content are required' });
    }
    res.json({ message: `Image created with content: ${content} and metadata ${JSON.stringify(metadata)}` });
});

export default router;

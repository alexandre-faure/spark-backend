import { Router } from 'express';
import imagesRoutes from './images';
import notificationsRoutes from './notifications';

const router = Router();

router.use('/images', imagesRoutes);
router.use('/notifications', notificationsRoutes);

export default router;

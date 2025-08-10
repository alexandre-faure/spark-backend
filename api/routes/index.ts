import { Router } from 'express';
import imagesRoutes from './images';
import notificationsRoutes from './notifications';

const router = Router();

router.get('/', (_, res) => {
    res.json({ message: 'Welcome to the Spark backend API!' });
});

router.use('/images', imagesRoutes);
router.use('/notifications', notificationsRoutes);

export default router;

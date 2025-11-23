import { Router } from 'express';
import imagesRoutes from './images';
import notificationsRoutes from './notifications';
import tmdbRoutes from "./tmdb";

const router = Router();

router.get('/', (_, res) => {
    res.json({ message: 'Welcome to the Spark backend API!' });
});

router.use('/images', imagesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/tmdb', tmdbRoutes);

export default router;

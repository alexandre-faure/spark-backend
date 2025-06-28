// src/routes/index.ts
import { Router } from 'express';
import imagesRoutes from './images';

const router = Router();

router.get('/', (_, res) => {
    res.json({ message: 'Welcome to the Spark backend API!' });
});

router.use('/images', imagesRoutes);

export default router;

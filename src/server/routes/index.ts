// src/routes/index.ts
import { Router } from 'express';
import imagesRoutes from './images';

const router = Router();

router.use('/images', imagesRoutes);

export default router;

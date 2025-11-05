import { Router } from 'express';

import { addWatermarkController } from '../controllers/watermarkController.js';
import { uploadSingleImage } from '../middleware/upload.js';

const router = Router();

router.post('/add-watermark', uploadSingleImage, addWatermarkController);

export default router;


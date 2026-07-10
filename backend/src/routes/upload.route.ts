import { Router } from 'express';
import { upload } from '../middleware/uploadMiddleware';
import { handleUpload } from '../controllers/upload.controller';

const router = Router();

router.post('/', upload.single('file'), handleUpload);

export default router;

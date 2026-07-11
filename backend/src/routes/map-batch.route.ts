import { Router } from 'express';
import { handleMapBatch } from '../controllers/map-batch.controller';

const router = Router();

router.post('/', handleMapBatch);

export default router;

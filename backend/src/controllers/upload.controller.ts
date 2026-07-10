import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { processImport } from '../services/ImportService';

export const handleUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      const err = new Error('No file uploaded.') as any;
      err.status = 400;
      throw err;
    }

    logger.info(`Received CSV file upload for importing: ${req.file.originalname} (${req.file.size} bytes)`);

    const result = await processImport(req.file.buffer);

    res.status(200).json({
      success: true,
      message: 'CSV imported and processed with AI successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

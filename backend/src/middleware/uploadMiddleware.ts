import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = [
    'text/csv',
    'application/csv',
    'text/x-csv',
    'application/vnd.ms-excel',
    'text/comma-separated-values',
  ];

  if (fileExt === '.csv' || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Invalid file type. Only CSV files are allowed.') as any;
    err.status = 400;
    cb(err, false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4.5 * 1024 * 1024, // 4.5MB limit (Vercel serverless body limit)
  },
});

export default upload;

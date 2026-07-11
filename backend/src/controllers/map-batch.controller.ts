import { Request, Response, NextFunction } from 'express';
import { mapBatchWithAI } from '../ai/AIService';
import { crmRecordSchema } from '../validation/crmValidator';
import { CrmRecord, SkippedRecord } from '../../shared/types';
import logger from '../utils/logger';

interface ValidationResult {
  valid: boolean;
  data?: any;
  reason?: string;
}

const validateRecord = (record: any): ValidationResult => {
  const parseResult = crmRecordSchema.safeParse(record);
  if (parseResult.success) {
    return { valid: true, data: parseResult.data };
  } else {
    const reason = parseResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
    return { valid: false, reason };
  }
};

export const handleMapBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { batch, batchIndex } = req.body;

    if (!Array.isArray(batch)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing or invalid "batch" payload. Must be an array of records.' }
      });
    }

    const index = typeof batchIndex === 'number' ? batchIndex : 0;
    const startRowNumber = index * batch.length + 2; // Approximate row number

    logger.info(`Received batch mapping request for batch ${index + 1} (${batch.length} records)`);

    const imported: CrmRecord[] = [];
    const skipped: SkippedRecord[] = [];

    try {
      // Map batch with AI (re-uses 429 smart rate-limit retry retry logic!)
      let mappedBatch = await mapBatchWithAI(batch, index);
      
      // Validate each record in the batch
      let validationResults = mappedBatch.map(validateRecord);
      const hasFailures = validationResults.some(res => !res.valid);

      if (hasFailures) {
        logger.warn(`Batch ${index + 1} has validation failures. Retrying once...`);
        mappedBatch = await mapBatchWithAI(batch, index);
        validationResults = mappedBatch.map(validateRecord);
      }

      // Compile results
      validationResults.forEach((result, idx) => {
        const rowNumber = startRowNumber + idx;
        const rawRowData = batch[idx];

        if (result.valid && result.data) {
          imported.push(result.data as CrmRecord);
        } else {
          const reason = result.reason || 'Unknown validation error';
          logger.warn(`Row ${rowNumber} skipped. Reason: ${reason}`);
          skipped.push({
            rowNumber,
            reason,
            rawRowData,
          });
        }
      });
    } catch (error: any) {
      logger.error(`Fatal error in batch ${index + 1}: ${error.message}`);
      
      // If the batch failed completely (even after retries/rate limit resets)
      batch.forEach((rawRowData, idx) => {
        skipped.push({
          rowNumber: startRowNumber + idx,
          reason: `Batch AI compilation failed: ${error.message}`,
          rawRowData,
        });
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        imported,
        skipped,
      }
    });
  } catch (error) {
    next(error);
  }
};

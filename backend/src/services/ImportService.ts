import { parseCsv } from '../csv/csvParser';
import { mapBatchWithAI } from '../ai/AIService';
import { crmRecordSchema } from '../validation/crmValidator';
import { ImportResult, CrmRecord, SkippedRecord } from '@shared/types';
import logger from '../utils/logger';

const BATCH_SIZE = 20;
const CONCURRENCY_LIMIT = 3;

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
    // Collect error messages
    const reason = parseResult.error.errors.map(err => {
      return `${err.path.join('.')}: ${err.message}`;
    }).join('; ');
    return { valid: false, reason };
  }
};

/**
 * Service to orchestrate the entire import flow:
 * Parse CSV -> Map with AI batch-by-batch -> Validate -> Retry failed batches -> Compile results
 */
export const processImport = async (fileBuffer: Buffer): Promise<ImportResult> => {
  const rawRows = parseCsv(fileBuffer);
  
  const imported: CrmRecord[] = [];
  const skipped: SkippedRecord[] = [];
  
  if (rawRows.length === 0) {
    return {
      imported,
      skipped,
      totalImported: 0,
      totalSkipped: 0,
      totalProcessed: 0,
      successRate: 0,
    };
  }

  // Chunk raw rows into batches
  const batches: Array<Array<Record<string, string>>> = [];
  for (let i = 0; i < rawRows.length; i += BATCH_SIZE) {
    batches.push(rawRows.slice(i, i + BATCH_SIZE));
  }

  logger.info(`Starting Import Flow: Total raw rows: ${rawRows.length}. Number of batches: ${batches.length}`);

  // We process batches with concurrency control using a worker pool
  let nextBatchIndex = 0;

  const worker = async () => {
    while (nextBatchIndex < batches.length) {
      const currentIndex = nextBatchIndex;
      nextBatchIndex++;

      const batch = batches[currentIndex];
      const startRowNumber = currentIndex * BATCH_SIZE + 2; // +1 for 0-index offset, +1 for CSV header row

      logger.info(`Processing batch ${currentIndex + 1}/${batches.length}`);

      try {
        // Attempt 1: Map batch with AI
        let mappedBatch = await mapBatchWithAI(batch, currentIndex);
        
        // Validate each record in the batch
        let validationResults = mappedBatch.map(validateRecord);
        const hasFailures = validationResults.some(res => !res.valid);

        if (hasFailures) {
          logger.warn(`Batch ${currentIndex + 1} has validation failures. Retrying this batch once through AI...`);
          
          // Retry once: Call AI mapping again
          mappedBatch = await mapBatchWithAI(batch, currentIndex);
          validationResults = mappedBatch.map(validateRecord);
        }

        // Process validation results for the final save
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
        logger.error(`Fatal error in batch ${currentIndex + 1}: ${error.message}. Skipping entire batch.`);
        // If a batch fails AI mapping completely after retries, skip all records in it
        batch.forEach((rawRowData, idx) => {
          skipped.push({
            rowNumber: startRowNumber + idx,
            reason: `Batch AI compilation failed: ${error.message}`,
            rawRowData,
          });
        });
      }
    }
  };

  // Run workers concurrently
  const workers: Promise<void>[] = [];
  const workersCount = Math.min(CONCURRENCY_LIMIT, batches.length);
  for (let i = 0; i < workersCount; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  const totalImported = imported.length;
  const totalSkipped = skipped.length;
  const totalProcessed = rawRows.length;
  const successRate = totalProcessed > 0 ? Math.round((totalImported / totalProcessed) * 100) : 0;

  // Sort skipped records by row number to maintain original order
  skipped.sort((a, b) => a.rowNumber - b.rowNumber);

  logger.info(`Import Flow Completed. Imported: ${totalImported}, Skipped: ${totalSkipped}, Total: ${totalProcessed}, Success Rate: ${successRate}%`);

  return {
    imported,
    skipped,
    totalImported,
    totalSkipped,
    totalProcessed,
    successRate,
  };
};

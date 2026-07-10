import logger from '../utils/logger';

/**
 * Processes an array of items in batches with a maximum concurrency limit.
 * Preserves the order of processing results.
 */
export const processInBatches = async <T, R>(
  items: T[],
  batchSize: number,
  concurrencyLimit: number,
  processor: (batch: T[], batchIndex: number) => Promise<R[]>
): Promise<R[]> => {
  const results: R[][] = new Array(Math.ceil(items.length / batchSize));
  const batches: T[][] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  if (batches.length === 0) {
    return [];
  }

  logger.info(`Starting batch processing: ${items.length} items, ${batches.length} batches, batch size: ${batchSize}, concurrency: ${concurrencyLimit}`);

  let nextBatchIndex = 0;

  const worker = async () => {
    while (nextBatchIndex < batches.length) {
      const currentIndex = nextBatchIndex;
      nextBatchIndex++;

      const batch = batches[currentIndex];
      logger.info(`Processing batch ${currentIndex + 1}/${batches.length} (${batch.length} items)`);
      
      try {
        const batchResult = await processor(batch, currentIndex);
        results[currentIndex] = batchResult;
      } catch (error) {
        logger.error(`Failed to process batch ${currentIndex + 1}:`, error);
        throw error; // Let the caller handle failures and retries
      }
    }
  };

  // Start concurrent workers
  const workersCount = Math.min(concurrencyLimit, batches.length);
  const workers: Promise<void>[] = [];
  
  for (let i = 0; i < workersCount; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  // Flatten results and return
  return results.flat();
};

export default processInBatches;

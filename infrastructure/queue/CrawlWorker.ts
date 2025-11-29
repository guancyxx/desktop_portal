/**
 * Crawl Worker - Background processor for crawl jobs
 * Runs independently to process jobs from the Redis queue
 */

import { Worker, Job } from 'bullmq';
import { CrawlJobData, CrawlJobResult } from './RedisQueueClient';
import { container } from '@/application/container';
import { sendWebhook } from './WebhookSender';

// Redis connection configuration
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

const QUEUE_NAME = 'crawl-jobs';

/**
 * Process a crawl job
 */
async function processCrawlJob(job: Job<CrawlJobData, CrawlJobResult>): Promise<CrawlJobResult> {
  const { taskId, organizationId, userId, url, configId, llm, webhookUrl } = job.data;

  console.log(`[CrawlWorker] Processing job ${taskId} for URL: ${url}`);

  try {
    // Update task status to IN_PROGRESS
    await container.crawlTaskRepository.updateStatus(taskId, 'IN_PROGRESS');

    // Execute crawl using the existing use case
    const result = await container.submitCrawlTask.execute({
      organizationId,
      userId,
      url,
      configId,
      llm,
    });

    console.log(`[CrawlWorker] Job ${taskId} completed successfully`);

    // Send webhook notification if configured
    if (webhookUrl) {
      await sendWebhook(webhookUrl, {
        taskId,
        status: 'COMPLETED',
        url,
        result: {
          markdown: result.markdownContent,
          extractedData: result.extractedData,
        },
        completedAt: new Date().toISOString(),
      }).catch(error => {
        console.error(`[CrawlWorker] Webhook failed for job ${taskId}:`, error.message);
        // Don't fail the job if webhook fails
      });
    }

    return {
      taskId,
      status: 'COMPLETED',
      markdown: result.markdownContent,
      extractedData: result.extractedData,
      executionTime: result.executionTime,
    };
  } catch (error: any) {
    console.error(`[CrawlWorker] Job ${taskId} failed:`, error.message);

    // Update task status to FAILED
    await container.crawlTaskRepository.updateStatus(taskId, 'FAILED', error.message);

    // Send webhook notification for failure if configured
    if (webhookUrl) {
      await sendWebhook(webhookUrl, {
        taskId,
        status: 'FAILED',
        url,
        error: error.message,
        completedAt: new Date().toISOString(),
      }).catch(webhookError => {
        console.error(`[CrawlWorker] Webhook failed for job ${taskId}:`, webhookError.message);
      });
    }

    return {
      taskId,
      status: 'FAILED',
      error: error.message,
    };
  }
}

/**
 * Create and start the crawl worker
 */
export function startCrawlWorker() {
  const worker = new Worker<CrawlJobData, CrawlJobResult>(
    QUEUE_NAME,
    processCrawlJob,
    {
      connection: redisConnection,
      concurrency: 5, // Process up to 5 jobs concurrently
    }
  );

  worker.on('completed', (job) => {
    console.log(`[CrawlWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[CrawlWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[CrawlWorker] Worker error:', err);
  });

  console.log('[CrawlWorker] Started with concurrency: 5');

  return worker;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[CrawlWorker] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[CrawlWorker] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

/**
 * Redis Queue Client using BullMQ
 * Provides job queue infrastructure for background processing
 */

import { Queue, QueueEvents, Job } from 'bullmq';
import IORedis from 'ioredis';

// Queue configuration
const QUEUE_NAME = 'crawl-jobs';

// Redis connection configuration
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
};

// Create Redis connection for BullMQ
const connection = new IORedis(redisConnection);

// Job data interface
export interface CrawlJobData {
  taskId: string;
  organizationId: string;
  userId: string;
  url: string;
  configId?: string;
  priority?: number;
  llm?: {
    provider: string;
    model?: string;
    schema?: object;
    instruction?: string;
  };
  webhookUrl?: string;
}

// Job result interface
export interface CrawlJobResult {
  taskId: string;
  status: 'COMPLETED' | 'FAILED';
  markdown?: string;
  extractedData?: object;
  error?: string;
  executionTime?: number;
}

/**
 * Redis Queue Client for managing crawl jobs
 */
export class RedisQueueClient {
  private queue: Queue<CrawlJobData, CrawlJobResult>;
  private queueEvents: QueueEvents;

  constructor() {
    // Initialize job queue
    this.queue = new Queue<CrawlJobData, CrawlJobResult>(QUEUE_NAME, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3, // Retry failed jobs up to 3 times
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 seconds delay
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 1000, // Keep max 1000 completed jobs
        },
        removeOnFail: {
          age: 604800, // Keep failed jobs for 7 days
        },
      },
    });

    // Initialize queue events for monitoring
    this.queueEvents = new QueueEvents(QUEUE_NAME, {
      connection: redisConnection,
    });

    console.log('[RedisQueueClient] Initialized with Redis at', `${redisConnection.host}:${redisConnection.port}`);
  }

  /**
   * Add a new crawl job to the queue
   */
  async addJob(data: CrawlJobData): Promise<Job<CrawlJobData, CrawlJobResult>> {
    const job = await this.queue.add('crawl', data, {
      priority: data.priority || 10, // Lower number = higher priority
      jobId: data.taskId, // Use taskId as job ID for easy lookup
    });

    console.log(`[RedisQueueClient] Job added: ${job.id} for URL: ${data.url}`);
    return job;
  }

  /**
   * Get job by ID (taskId)
   */
  async getJob(taskId: string): Promise<Job<CrawlJobData, CrawlJobResult> | undefined> {
    return await this.queue.getJob(taskId);
  }

  /**
   * Cancel a pending or active job
   */
  async cancelJob(taskId: string): Promise<boolean> {
    const job = await this.getJob(taskId);
    if (!job) {
      return false;
    }

    const state = await job.getState();
    
    // Only cancel if job is waiting, delayed, or active
    if (['waiting', 'delayed', 'active'].includes(state)) {
      await job.remove();
      console.log(`[RedisQueueClient] Job cancelled: ${taskId}`);
      return true;
    }

    console.log(`[RedisQueueClient] Cannot cancel job in state: ${state}`);
    return false;
  }

  /**
   * Get job state
   */
  async getJobState(taskId: string): Promise<string | undefined> {
    const job = await this.getJob(taskId);
    if (!job) {
      return undefined;
    }
    return await job.getState();
  }

  /**
   * Get active jobs count
   */
  async getActiveCount(): Promise<number> {
    return await this.queue.getActiveCount();
  }

  /**
   * Get waiting jobs count
   */
  async getWaitingCount(): Promise<number> {
    return await this.queue.getWaitingCount();
  }

  /**
   * Check if concurrency limit is reached for a tenant
   */
  async checkConcurrencyLimit(organizationId: string, limit: number = 10): Promise<boolean> {
    const activeJobs = await this.queue.getActive();
    const tenantActiveJobs = activeJobs.filter(
      job => job.data.organizationId === organizationId
    );
    return tenantActiveJobs.length >= limit;
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  /**
   * Close connections
   */
  async close() {
    await this.queue.close();
    await this.queueEvents.close();
    await connection.quit();
  }
}

// Singleton instance
let queueClientInstance: RedisQueueClient | null = null;

export function getQueueClient(): RedisQueueClient {
  if (!queueClientInstance) {
    queueClientInstance = new RedisQueueClient();
  }
  return queueClientInstance;
}

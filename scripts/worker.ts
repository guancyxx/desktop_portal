#!/usr/bin/env tsx
/**
 * Crawl Worker Script
 * Runs as a standalone process to process background jobs
 * 
 * Usage:
 *   pnpm worker        # Development
 *   node worker.js     # Production
 */

import { startCrawlWorker } from './infrastructure/queue/CrawlWorker';

console.log('Starting Crawl Worker...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Redis Host:', process.env.REDIS_HOST || 'localhost');
console.log('Redis Port:', process.env.REDIS_PORT || '6379');

// Start the worker
const worker = startCrawlWorker();

console.log('Crawl Worker is running. Press Ctrl+C to stop.');

// Keep the process running
process.stdin.resume();

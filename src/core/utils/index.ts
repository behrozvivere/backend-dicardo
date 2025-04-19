/**
 * ماژول ابزارهای مشترک (Utils)
 * این فایل نقطه ورود اصلی برای دسترسی به همه ابزارهای عمومی است
 * و امکان استفاده از ابزارها را به صورت ماژولار فراهم می‌کند.
 * 
 * @module Utils
 */

/**
 * سیستم کش با قابلیت زمان انقضا
 */
import cache, { SimpleCache } from './cache';
export { cache, SimpleCache };

/**
 * سیستم لاگ کردن و مدیریت خطاها
 */
import logger, { Logger, LogLevel } from './logger';
export { logger, Logger, LogLevel };

/**
 * سیستم صف برای مدیریت وظایف
 */
import queue, { Queue, QueueState, QueueOptions, TaskFunction } from './queue';
export { queue, Queue, QueueState, QueueOptions, TaskFunction };

/**
 * تایپ‌های مشترک که در چندین ماژول استفاده می‌شوند
 */
export interface UtilsConfig {
  cache: {
    defaultTTL: number;
  };
  logger: {
    level: LogLevel;
    writeToFile: boolean;
    logFilePath: string;
  };
  queue: {
    concurrency: number;
    maxRetries: number; 
    retryDelay: number;
  };
}

/**
 * پیکربندی پیش‌فرض برای ماژول‌های ابزاری
 */
const defaultConfig: UtilsConfig = {
  cache: {
    defaultTTL: 3600, // 1 ساعت
  },
  logger: {
    level: LogLevel.INFO,
    writeToFile: false,
    logFilePath: './logs',
  },
  queue: {
    concurrency: 5,
    maxRetries: 3,
    retryDelay: 1000,
  },
};

/**
 * پیکربندی همه ابزارها با یک فراخوانی
 * @param config تنظیمات مورد نظر
 */
export function configureUtils(config: Partial<UtilsConfig> = {}): void {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
    cache: { ...defaultConfig.cache, ...config.cache },
    logger: { ...defaultConfig.logger, ...config.logger },
    queue: { ...defaultConfig.queue, ...config.queue },
  };

  // پیکربندی لاگر
  logger.configure({
    logLevel: mergedConfig.logger.level,
    writeToFile: mergedConfig.logger.writeToFile,
    logFilePath: mergedConfig.logger.logFilePath,
  });

  // ایجاد صف جدید با تنظیمات مورد نظر (نمونه پیش‌فرض صف را نمی‌توان مستقیماً تنظیم کرد)
  new Queue({
    concurrency: mergedConfig.queue.concurrency,
    maxRetries: mergedConfig.queue.maxRetries,
    retryDelay: mergedConfig.queue.retryDelay,
  });

  logger.debug('ابزارها (Utils) با موفقیت پیکربندی شدند', {
    logLevel: mergedConfig.logger.level,
    queueConcurrency: mergedConfig.queue.concurrency,
    cacheTTL: mergedConfig.cache.defaultTTL
  });
}

/**
 * ایجاد یک صف جدید با تنظیمات سفارشی
 * @param options تنظیمات صف
 * @returns نمونه جدید از صف
 */
export function createQueue(options?: Partial<QueueOptions>): Queue {
  return new Queue(options);
}

/**
 * نسخه‌ی یکپارچه‌ شده‌ی تمام ابزارها
 */
export default {
  cache,
  logger,
  queue,
  configureUtils,
  createQueue
};
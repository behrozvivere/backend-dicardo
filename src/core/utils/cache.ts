/**
 * یک کلاس کش ساده برای ذخیره و بازیابی داده‌ها
 * با قابلیت تعیین زمان انقضا برای هر داده
 */

// نوع داده آیتم‌های کش
interface CacheItem<T> {
  value: T;
  expiry: number | null; // زمان انقضا (null به معنی بدون انقضا)
}

/**
 * کلاس کش ساده
 */
export class SimpleCache {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number; // زمان پیش‌فرض انقضا به میلی‌ثانیه

  /**
   * سازنده کلاس کش
   * @param defaultTTL زمان پیش‌فرض انقضا به ثانیه (پیش‌فرض: یک ساعت)
   */
  constructor(defaultTTL: number = 3600) {
    this.cache = new Map<string, CacheItem<any>>();
    this.defaultTTL = defaultTTL * 1000; // تبدیل به میلی‌ثانیه
  }

  /**
   * ذخیره داده در کش
   * @param key کلید مورد استفاده برای ذخیره داده
   * @param value مقدار مورد نظر برای ذخیره
   * @param ttl زمان انقضا به ثانیه (null: استفاده از مقدار پیش‌فرض، -1: بدون انقضا)
   */
  set<T>(key: string, value: T, ttl: number | null = null): void {
    const expiryTime = ttl === -1 
      ? null
      : Date.now() + (ttl ? ttl * 1000 : this.defaultTTL);

    this.cache.set(key, {
      value,
      expiry: expiryTime
    });
  }

  /**
   * بازیابی داده از کش
   * @param key کلید مورد نظر
   * @returns مقدار ذخیره شده یا undefined اگر موجود نباشد یا منقضی شده باشد
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // اگر آیتم موجود نبود
    if (!item) {
      return undefined;
    }
    
    // بررسی انقضای آیتم
    if (item.expiry !== null && Date.now() > item.expiry) {
      // آیتم منقضی شده است، آن را حذف می‌کنیم
      this.delete(key);
      return undefined;
    }
    
    return item.value as T;
  }

  /**
   * بررسی وجود کلید در کش
   * @param key کلید مورد نظر
   * @returns آیا کلید در کش موجود است و منقضی نشده؟
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }
    
    // بررسی انقضای آیتم
    if (item.expiry !== null && Date.now() > item.expiry) {
      // آیتم منقضی شده است، آن را حذف می‌کنیم
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * حذف یک کلید از کش
   * @param key کلید مورد نظر برای حذف
   * @returns آیا حذف موفقیت‌آمیز بود؟
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * پاک کردن کامل کش
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * دریافت تعداد آیتم‌های موجود در کش
   * (شامل آیتم‌های منقضی که هنوز حذف نشده‌اند)
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * پاک کردن تمام آیتم‌های منقضی از کش
   * @returns تعداد آیتم‌های حذف شده
   */
  cleanExpired(): number {
    let count = 0;
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry !== null && now > item.expiry) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  /**
   * دریافت لیست کلیدهای موجود در کش
   * (شامل آیتم‌های منقضی که هنوز حذف نشده‌اند)
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * یک نمونه پیش‌فرض از کش برای استفاده در کل برنامه
 */
const defaultCache = new SimpleCache();
export default defaultCache;
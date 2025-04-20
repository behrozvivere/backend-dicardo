/**
 * تایپ‌های مربوط به مدل سرویس‌ها در دیتابیس
 */

/**
 * رابط مدل سرویس در دیتابیس
 */
export interface Service {
  code: string;          // کد سرویس
  name: string;          // نام سرویس
  image?: string;        // آدرس تصویر سرویس
}

/**
 * تایپ بازگشتی برای دریافت لیست سرویس‌ها
 */
export type ServiceList = Service[];
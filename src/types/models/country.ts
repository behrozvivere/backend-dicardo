/**
 * تایپ‌های مربوط به مدل کشورها در دیتابیس
 */

/**
 * رابط مدل کشور در دیتابیس
 */
export interface Country {
  id: number;            // شناسه کشور
  name: string;          // نام کشور به زبان انگلیسی
  visible: number;       // وضعیت نمایش (0 یا 1)
  retry: number;         // قابلیت درخواست مجدد (0 یا 1)
  rent: number;          // قابلیت اجاره (0 یا 1)
  multiService: number;  // پشتیبانی از چند سرویس (0 یا 1)
  image?: string;        // آدرس تصویر پرچم کشور
}

/**
 * تایپ بازگشتی برای دریافت لیست کشورها
 */
export type CountryList = Country[];
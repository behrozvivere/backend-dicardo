/**
 * تایپ‌های مربوط به داده‌های خام کشورها دریافتی از API
 */

/**
 * تایپ داده کشور برای استفاده در پاسخ API
 */
export interface RawCountryData {
  id: number;            // شناسه کشور
  rus: string;           // نام کشور به زبان روسی
  eng: string;           // نام کشور به زبان انگلیسی
  chn: string;           // نام کشور به زبان چینی
  visible: number;       // وضعیت نمایش (0 یا 1)
  retry: number;         // قابلیت درخواست مجدد (0 یا 1)
  rent: number;          // قابلیت اجاره (0 یا 1)
  multiService: number;  // پشتیبانی از چند سرویس (0 یا 1)
}

/**
 * تایپ پاسخ API برای درخواست کشورها
 * کلید آبجکت شناسه عددی کشور به صورت رشته است
 */
export interface RawCountriesResponse {
  [key: string]: RawCountryData;
}
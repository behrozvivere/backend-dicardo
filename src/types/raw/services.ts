/**
 * تایپ‌های مربوط به داده‌های خام سرویس‌ها دریافتی از API
 */

/**
 * تایپ سرویس برای استفاده در پاسخ API
 */
export interface RawService {
  code: string;  // کد سرویس
  name: string;  // نام سرویس
}

/**
 * تایپ پاسخ API برای درخواست فهرست سرویس‌ها
 */
export interface RawServicesResponse {
  status: string;          // وضعیت درخواست ('success' یا 'error')
  services: RawService[];  // آرایه‌ای از سرویس‌ها
}
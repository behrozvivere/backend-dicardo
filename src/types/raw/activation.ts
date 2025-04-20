/**
 * تایپ‌های مربوط به داده‌های خام فعال‌سازی شماره دریافتی از API
 */

/**
 * تایپ پارامترهای درخواست برای API فعالسازی شماره V2
 */
export interface RawGetNumberV2Params {
  service: string;            // کد سرویس
  country?: number;           // کد کشور (اختیاری)
  operator?: string;          // اپراتور (اختیاری)
  forward?: boolean;          // هدایت پیامک (اختیاری) 
  ref?: string;               // مرجع ارجاع (اختیاری)
  phoneException?: string;    // استثناهای شماره تلفن (اختیاری)
  maxPrice?: number;          // حداکثر قیمت (اختیاری)
  activationType?: string;    // نوع فعالسازی (اختیاری)
  language?: string;          // زبان (اختیاری)
  userId?: string;            // شناسه کاربر (اختیاری)
  orderId?: string;           // شناسه سفارش (اختیاری)
}

/**
 * تایپ پاسخ API برای درخواست فعالسازی شماره V2
 */
export interface RawGetNumberV2Response {
  activationId: number;        // شناسه فعالسازی
  phoneNumber: string;         // شماره تلفن
  activationCost: number;      // هزینه فعالسازی
  currency: number;            // کد ارز (ISO 4217 Num)
  countryCode: string;         // کد کشور
  canGetAnotherSms: string;    // آیا می‌توان پیامک دیگری دریافت کرد؟
  activationTime: string;      // زمان فعالسازی
  activationOperator: string;  // اپراتور فعالسازی
}

/**
 * نوع خطاهای ممکن برای API فعالسازی شماره
 */
export enum RawActivationErrorType {
  ORDER_ALREADY_EXISTS = 'ORDER_ALREADY_EXISTS',   // سفارش قبلاً ایجاد شده است
}

/**
 * وضعیت‌های ممکن فعالسازی
 */
export enum RawActivationStatus {
  WAITING_CODE = 'STATUS_WAIT_CODE',     // در انتظار کد
  WAIT_RETRY = 'STATUS_WAIT_RETRY',      // در انتظار ارسال مجدد کد
  OK = 'STATUS_OK',                      // کد دریافت شد
  CANCEL = 'STATUS_CANCEL',              // لغو شد
}

/**
 * عملیات‌های ممکن برای تغییر وضعیت فعالسازی
 */
export enum RawActivationOperation {
  CANCEL = '8',       // لغو فعالسازی
  FINISHED = '6',     // پایان فعالسازی (کد با موفقیت دریافت شد)
  RETRY = '3',        // درخواست ارسال مجدد کد
}

/**
 * پاسخ دریافت وضعیت فعالسازی
 */
export interface RawGetActivationStatusResponse {
  status: RawActivationStatus;  // وضعیت فعالسازی
  code?: string;                // کد SMS (اگر دریافت شده باشد)
}
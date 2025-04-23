/**
 * تایپ‌های مربوط به مدل فعال‌سازی در دیتابیس
 */

/**
 * وضعیت‌های ممکن فعالسازی
 */
export enum ActivationStatus {
  WAITING_CODE = 'STATUS_WAIT_CODE',     // در انتظار کد
  WAIT_RETRY = 'STATUS_WAIT_RETRY',      // در انتظار ارسال مجدد کد
  OK = 'STATUS_OK',                      // کد دریافت شد
  CANCEL = 'STATUS_CANCEL',              // لغو شد
}

/**
 * رابط مدل فعال‌سازی در دیتابیس
 */
export interface Activation {
  serviceCode: string;         // کد سرویس
  countryId: number;           // شناسه کشور
  operator: string;            // اپراتور
  phoneNumber: string;         // شماره تلفن
  activationId: number;        // شناسه فعالسازی
  activationCost: number;      // هزینه فعالسازی
  activationTime: string;      // زمان فعالسازی
  canGetAnotherSms: boolean;   // آیا می‌توان پیامک دیگری دریافت کرد؟
  activationEndTime?: string;  // زمان پایان فعالسازی
  sms?: string;                // پیام دریافتی
  status: ActivationStatus;    // وضعیت فعالسازی
  orderId?: string;            // شناسه سفارش
  priceIRT?: number;           // قیمت به تومان
}

/**
 * تایپ بازگشتی برای دریافت لیست فعال‌سازی‌ها
 */
export type ActivationList = Activation[];

/**
 * پارامترهای ایجاد یک فعال‌سازی جدید
 */
export interface CreateActivationParams {
  serviceCode: string;         // کد سرویس
  countryId: number;           // شناسه کشور (اختیاری)
  operator?: string;           // اپراتور (اختیاری)
  orderId?: string;            // شناسه سفارش (اختیاری)
}

/**
 * پارامترهای به‌روزرسانی وضعیت یک فعال‌سازی
 */
export interface UpdateActivationStatusParams {
  activationId: number;        // شناسه فعالسازی
  status: ActivationStatus;    // وضعیت جدید
  sms?: string;                // کد دریافتی (اختیاری)
}
/**
 * تایپ‌های مربوط به داده‌های خام کشورهای برتر دریافتی از API
 */

/**
 * تایپ داده کشور برتر برای یک سرویس
 */
export interface RawTopCountryData {
  country: number;                       // شناسه کشور
  count: number;                         // تعداد شماره‌های موجود
  price: number;                         // قیمت (به واحد ارز سایت)
  retail_price: number;                  // قیمت خرده‌فروشی
  freePriceMap?: { [price: string]: number };  // نقشه قیمت آزاد (اختیاری)
}

/**
 * تایپ پاسخ API برای درخواست کشورهای برتر
 * کلید آبجکت کد سرویس است
 */
export interface RawTopCountriesResponse {
  [key: string]: RawTopCountryData;
}
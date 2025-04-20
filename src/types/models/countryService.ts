/**
 * تایپ‌های مربوط به مدل ارتباط کشور و سرویس در دیتابیس
 */

/**
 * رابط مدل ارتباط کشور و سرویس در دیتابیس
 */
export interface CountryService {
  serviceCode: string;    // کد سرویس
  countryId: number;      // شناسه کشور
  count: number;          // تعداد شماره‌های موجود
  price: number;          // قیمت (به واحد ارز API)
  retailPrice: number;    // قیمت خرده‌فروشی
}

/**
 * تایپ بازگشتی برای دریافت لیست ارتباط کشور و سرویس
 */
export type CountryServiceList = CountryService[];
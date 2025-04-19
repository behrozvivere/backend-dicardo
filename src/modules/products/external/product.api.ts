/**
 * product.api.ts
 * 
 * این فایل مسئول دریافت داده‌ها از API خارجی SMS-Activate است.
 * این ماژول با استفاده از متغیرهای محیطی برای کلید API و URL درخواست‌های لازم را ارسال می‌کند.
 */

import axios, { AxiosResponse } from 'axios';
import { env } from '../../../config/env';
import cache from '../../../core/utils/cache';
import logger from '../../../core/utils/logger';

/**
 * تایپ داده کشور برای استفاده در پاسخ API
 */
export interface CountryData {
  id: number;
  rus: string;
  eng: string; 
  chn: string;
  visible: number;
  retry: number;
  rent: number;
  multiService: number;
}

/**
 * تایپ پاسخ API برای درخواست کشورها
 */
export interface CountriesResponse {
  [key: string]: CountryData;
}

/**
 * تایپ سرویس برای استفاده در پاسخ API
 */
export interface Service {
  code: string;
  name: string;
}

/**
 * تایپ پاسخ API برای درخواست فهرست سرویس‌ها
 */
export interface ServicesResponse {
  status: string;
  services: Service[];
}

/**
 * تایپ داده کشور برتر برای یک سرویس
 */
export interface TopCountryData {
  country: number;
  count: number;
  price: number;
  retail_price: number;
  freePriceMap?: { [price: string]: number };
}

/**
 * تایپ پاسخ API برای درخواست کشورهای برتر
 */
export interface TopCountriesResponse {
  [key: string]: TopCountryData;
}

/**
 * تایپ پارامترهای درخواست برای API فعالسازی شماره V2
 */
export interface GetNumberV2Params {
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
export interface GetNumberV2Response {
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
export enum ActivationErrorType {
  ORDER_ALREADY_EXISTS = 'ORDER_ALREADY_EXISTS',   // سفارش قبلاً ایجاد شده است
}

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
 * عملیات‌های ممکن برای تغییر وضعیت فعالسازی
 */
export enum ActivationOperation {
  CANCEL = '8',       // لغو فعالسازی
  FINISHED = '6',     // پایان فعالسازی (کد با موفقیت دریافت شد)
  RETRY = '3',        // درخواست ارسال مجدد کد
}

/**
 * پاسخ دریافت وضعیت فعالسازی
 */
export interface GetActivationStatusResponse {
  status: ActivationStatus;  // وضعیت فعالسازی
  code?: string;             // کد SMS (اگر دریافت شده باشد)
}

/**
 * کلیدهای کش برای ذخیره نتایج API
 */
const CACHE_KEYS = {
  COUNTRIES: 'sms_activate_countries',
  SERVICES: 'sms_activate_services',
  TOP_COUNTRIES: 'sms_activate_top_countries',
  NUMBER_V2: 'sms_activate_number_v2',
};

/**
 * کلاس API برای ارتباط با سرویس SMS-Activate
 */
export class ProductApi {
  private apiKey: string;
  private apiUrl: string;
  private cacheEnabled: boolean;
  private cacheTTL: number; // زمان اعتبار کش به ثانیه

  /**
   * سازنده کلاس
   * @param cacheEnabled فعال بودن کش (پیش‌فرض: بله)
   * @param cacheTTL مدت زمان اعتبار کش به ثانیه (پیش‌فرض: یک ساعت)
   */
  constructor(cacheEnabled: boolean = true, cacheTTL: number = 3600) {
    this.apiKey = env.smsActivate.apiKey;
    this.apiUrl = env.smsActivate.apiUrl;
    this.cacheEnabled = cacheEnabled;
    this.cacheTTL = cacheTTL;

    // بررسی وجود کلید API و URL
    if (!this.apiKey) {
      logger.error('کلید API برای SMS-Activate تنظیم نشده است.');
    }

    if (!this.apiUrl) {
      logger.error('آدرس URL برای SMS-Activate تنظیم نشده است.');
    }
  }

  /**
   * دریافت لیست کشورها از API
   * @returns لیست کشورهای موجود
   */
  async getCountries(): Promise<CountriesResponse> {
    const cacheKey = CACHE_KEYS.COUNTRIES;

    // بررسی کش اگر فعال است
    if (this.cacheEnabled) {
      const cachedData = cache.get<CountriesResponse>(cacheKey);
      if (cachedData) {
        logger.debug('دریافت لیست کشورها از کش');
        return cachedData;
      }
    }

    try {
      logger.info('درخواست دریافت لیست کشورها از SMS-Activate API');
      
      // ساخت URL درخواست
      const requestUrl = `${this.apiUrl}?api_key=${this.apiKey}&action=getCountries`;
      
      // ارسال درخواست
      const response: AxiosResponse<CountriesResponse> = await axios.get(requestUrl);
      
      // بررسی پاسخ
      if (response.status !== 200) {
        throw new Error(`خطای HTTP: ${response.status}`);
      }

      const countries = response.data;
      
      // ذخیره در کش
      if (this.cacheEnabled) {
        cache.set(cacheKey, countries, this.cacheTTL);
        logger.debug(`ذخیره لیست کشورها در کش (مدت اعتبار: ${this.cacheTTL} ثانیه)`);
      }

      logger.success(`دریافت ${Object.keys(countries).length} کشور از API`);
      return countries;
    } catch (error) {
      logger.error('خطا در دریافت لیست کشورها:', error);
      throw new Error(`خطا در دریافت لیست کشورها: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * دریافت فهرست سرویس‌ها از API
   * @param country شناسه کشور (اختیاری)
   * @param lang زبان پاسخ (اختیاری)
   * @returns فهرست سرویس‌های موجود
   */
  async getServicesList(country?: number, lang: string = 'en'): Promise<ServicesResponse> {
    // ساخت کلید کش مناسب بر اساس پارامترهای ورودی
    const cacheKey = country 
      ? `${CACHE_KEYS.SERVICES}_${country}_${lang}` 
      : `${CACHE_KEYS.SERVICES}_${lang}`;

    // بررسی کش اگر فعال است
    if (this.cacheEnabled) {
      const cachedData = cache.get<ServicesResponse>(cacheKey);
      if (cachedData) {
        logger.debug('دریافت فهرست سرویس‌ها از کش');
        return cachedData;
      }
    }

    try {
      logger.info('درخواست دریافت فهرست سرویس‌ها از SMS-Activate API');
      
      // ساخت URL درخواست
      let requestUrl = `${this.apiUrl}?api_key=${this.apiKey}&action=getServicesList`;
      
      // افزودن پارامترهای اختیاری
      if (country !== undefined) {
        requestUrl += `&country=${country}`;
      }
      
      requestUrl += `&lang=${lang}`;
      
      // ارسال درخواست
      const response: AxiosResponse<ServicesResponse> = await axios.get(requestUrl);
      
      // بررسی پاسخ
      if (response.status !== 200) {
        throw new Error(`خطای HTTP: ${response.status}`);
      }

      const servicesList = response.data;
      
      // بررسی وضعیت پاسخ
      if (servicesList.status !== 'success') {
        throw new Error(`خطای API: ${JSON.stringify(servicesList)}`);
      }
      
      // ذخیره در کش
      if (this.cacheEnabled) {
        cache.set(cacheKey, servicesList, this.cacheTTL);
        logger.debug(`ذخیره فهرست سرویس‌ها در کش (مدت اعتبار: ${this.cacheTTL} ثانیه)`);
      }

      logger.success(`دریافت ${servicesList.services.length} سرویس از API`);
      return servicesList;
    } catch (error) {
      logger.error('خطا در دریافت فهرست سرویس‌ها:', error);
      throw new Error(`خطا در دریافت فهرست سرویس‌ها: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * دریافت کشورهای برتر برای یک سرویس خاص یا تمام سرویس‌ها
   * @param service کد سرویس (اختیاری)
   * @param freePrice استفاده از قیمت آزاد (اختیاری)
   * @returns لیست کشورهای برتر
   */
  async getTopCountriesByService(service?: string, freePrice: boolean = false): Promise<TopCountriesResponse> {
    // ساخت کلید کش مناسب بر اساس پارامترهای ورودی
    const cacheKey = service 
      ? `${CACHE_KEYS.TOP_COUNTRIES}_${service}_${freePrice ? 'free' : 'normal'}` 
      : `${CACHE_KEYS.TOP_COUNTRIES}_all_${freePrice ? 'free' : 'normal'}`;

    // بررسی کش اگر فعال است
    if (this.cacheEnabled) {
      const cachedData = cache.get<TopCountriesResponse>(cacheKey);
      if (cachedData) {
        logger.debug('دریافت لیست کشورهای برتر از کش');
        return cachedData;
      }
    }

    try {
      logger.info('درخواست دریافت لیست کشورهای برتر از SMS-Activate API');
      
      // ساخت URL درخواست
      let requestUrl = `${this.apiUrl}?api_key=${this.apiKey}&action=getTopCountriesByService`;
      
      // افزودن پارامترهای اختیاری
      if (service) {
        requestUrl += `&service=${service}`;
      }
      
      if (freePrice) {
        requestUrl += `&freePrice=true`;
      }
      
      // ارسال درخواست
      const response: AxiosResponse<TopCountriesResponse> = await axios.get(requestUrl);
      
      // بررسی پاسخ
      if (response.status !== 200) {
        throw new Error(`خطای HTTP: ${response.status}`);
      }

      const topCountries = response.data;
      
      // ذخیره در کش
      if (this.cacheEnabled) {
        cache.set(cacheKey, topCountries, this.cacheTTL);
        logger.debug(`ذخیره لیست کشورهای برتر در کش (مدت اعتبار: ${this.cacheTTL} ثانیه)`);
      }

      logger.success(`دریافت ${Object.keys(topCountries).length} کشور برتر از API`);
      return topCountries;
    } catch (error) {
      logger.error('خطا در دریافت لیست کشورهای برتر:', error);
      throw new Error(`خطا در دریافت لیست کشورهای برتر: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * دریافت شماره فعالسازی با استفاده از API نسخه 2
   * این متد شماره تلفن جدید برای فعالسازی را درخواست می‌کند
   * @param params پارامترهای درخواست شماره فعالسازی
   * @returns اطلاعات فعالسازی شماره تلفن
   */
  async getNumberV2(params: GetNumberV2Params): Promise<GetNumberV2Response> {
    // برای این نوع درخواست نیازی به کش نداریم، چون هر بار باید شماره جدید دریافت شود
    try {
      logger.info('درخواست دریافت شماره فعالسازی از SMS-Activate API');
      logger.debug('پارامترهای درخواست:', params);
      
      // ساخت URL درخواست
      let requestUrl = `${this.apiUrl}?api_key=${this.apiKey}&action=getNumberV2`;
      
      // افزودن پارامتر سرویس که اجباری است
      requestUrl += `&service=${params.service}`;
      
      // افزودن پارامترهای اختیاری
      if (params.country !== undefined) {
        requestUrl += `&country=${params.country}`;
      }
      
      if (params.operator) {
        requestUrl += `&operator=${params.operator}`;
      }
      
      if (params.forward !== undefined) {
        requestUrl += `&forward=${params.forward ? '1' : '0'}`;
      }
      
      if (params.ref) {
        requestUrl += `&ref=${params.ref}`;
      }
      
      if (params.phoneException) {
        requestUrl += `&phoneException=${params.phoneException}`;
      }
      
      if (params.maxPrice !== undefined) {
        requestUrl += `&maxPrice=${params.maxPrice}`;
      }
      
      if (params.activationType) {
        requestUrl += `&activationType=${params.activationType}`;
      }
      
      if (params.language) {
        requestUrl += `&language=${params.language}`;
      }
      
      if (params.userId) {
        requestUrl += `&userId=${params.userId}`;
      }
      
      if (params.orderId) {
        requestUrl += `&orderId=${params.orderId}`;
      }
      
      // ارسال درخواست
      const response: AxiosResponse<GetNumberV2Response | string> = await axios.get(requestUrl);
      
      // بررسی پاسخ
      if (response.status !== 200) {
        throw new Error(`خطای HTTP: ${response.status}`);
      }

      // بررسی خطاهای احتمالی در پاسخ
      const data = response.data;
      
      if (typeof data === 'string') {
        // بررسی خطاها
        if (data.includes(ActivationErrorType.ORDER_ALREADY_EXISTS)) {
          throw new Error(`خطای API: ${ActivationErrorType.ORDER_ALREADY_EXISTS} - سفارش قبلاً ایجاد شده است`);
        }
        throw new Error(`خطای API: ${data}`);
      }
      
      // اگر پاسخ یک آبجکت باشد، به عنوان پاسخ موفق تلقی می‌شود
      const activation = data as GetNumberV2Response;
      
      logger.success(`دریافت شماره فعالسازی با موفقیت انجام شد: ${activation.phoneNumber}`);
      return activation;
    } catch (error) {
      logger.error('خطا در دریافت شماره فعالسازی:', error);
      throw new Error(`خطا در دریافت شماره فعالسازی: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * دریافت وضعیت فعالسازی و کد SMS
   * @param activationId شناسه فعالسازی
   * @returns وضعیت فعالسازی و کد SMS (در صورت وجود)
   */
  async getActivationStatus(activationId: number): Promise<GetActivationStatusResponse> {
    try {
      logger.info(`درخواست وضعیت فعالسازی برای شناسه ${activationId}`);
      
      // ساخت URL درخواست
      const requestUrl = `${this.apiUrl}?api_key=${this.apiKey}&action=getStatus&id=${activationId}`;
      
      // ارسال درخواست
      const response: AxiosResponse<string> = await axios.get(requestUrl);
      
      // بررسی پاسخ
      if (response.status !== 200) {
        throw new Error(`خطای HTTP: ${response.status}`);
      }

      const data = response.data;
      
      // بررسی وضعیت و استخراج کد در صورت وجود
      if (data.startsWith(ActivationStatus.OK)) {
        // استخراج کد - فرمت پاسخ: STATUS_OK:123456
        const code = data.split(':')[1];
        logger.success(`کد دریافت شد: ${code}`);
        return { status: ActivationStatus.OK, code };
      } 
      else if (data === ActivationStatus.WAITING_CODE) {
        logger.debug('وضعیت: در انتظار دریافت کد');
        return { status: ActivationStatus.WAITING_CODE };
      }
      else if (data === ActivationStatus.WAIT_RETRY) {
        logger.debug('وضعیت: در انتظار ارسال مجدد کد');
        return { status: ActivationStatus.WAIT_RETRY };
      }
      else if (data === ActivationStatus.CANCEL) {
        logger.debug('وضعیت: فعالسازی لغو شده است');
        return { status: ActivationStatus.CANCEL };
      }
      else {
        // پاسخ غیرمنتظره
        logger.warn(`وضعیت ناشناخته: ${data}`);
        throw new Error(`وضعیت ناشناخته دریافت شد: ${data}`);
      }
    } catch (error) {
      logger.error('خطا در دریافت وضعیت فعالسازی:', error);
      throw new Error(`خطا در دریافت وضعیت فعالسازی: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * تغییر وضعیت فعالسازی (مثل لغو، اتمام، یا درخواست ارسال مجدد)
   * @param activationId شناسه فعالسازی
   * @param operation عملیات مورد نظر
   * @returns نتیجه عملیات
   */
  async setActivationStatus(activationId: number, operation: ActivationOperation): Promise<boolean> {
    try {
      let operationName = 'نامشخص';
      switch (operation) {
        case ActivationOperation.CANCEL:
          operationName = 'لغو';
          break;
        case ActivationOperation.FINISHED:
          operationName = 'اتمام';
          break;
        case ActivationOperation.RETRY:
          operationName = 'ارسال مجدد';
          break;
      }
      
      logger.info(`درخواست ${operationName} فعالسازی برای شناسه ${activationId}`);
      
      // ساخت URL درخواست
      const requestUrl = `${this.apiUrl}?api_key=${this.apiKey}&action=setStatus&id=${activationId}&status=${operation}`;
      
      // ارسال درخواست
      const response: AxiosResponse<string> = await axios.get(requestUrl);
      
      // بررسی پاسخ
      if (response.status !== 200) {
        throw new Error(`خطای HTTP: ${response.status}`);
      }

      const data = response.data;
      
      // بررسی نتیجه
      if (data === 'ACCESS_READY' || data === 'ACCESS_RETRY_GET' || data === 'ACCESS_ACTIVATION') {
        logger.success(`عملیات ${operationName} با موفقیت انجام شد`);
        return true;
      } else {
        logger.warn(`پاسخ نامعتبر برای عملیات ${operationName}: ${data}`);
        throw new Error(`پاسخ نامعتبر دریافت شد: ${data}`);
      }
    } catch (error) {
      logger.error('خطا در تغییر وضعیت فعالسازی:', error);
      throw new Error(`خطا در تغییر وضعیت فعالسازی: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * لغو فعالسازی
   * @param activationId شناسه فعالسازی
   * @returns آیا عملیات با موفقیت انجام شد
   */
  async cancelActivation(activationId: number): Promise<boolean> {
    return this.setActivationStatus(activationId, ActivationOperation.CANCEL);
  }

  /**
   * اعلام اتمام فعالسازی
   * @param activationId شناسه فعالسازی
   * @returns آیا عملیات با موفقیت انجام شد
   */
  async finishActivation(activationId: number): Promise<boolean> {
    return this.setActivationStatus(activationId, ActivationOperation.FINISHED);
  }

  /**
   * درخواست ارسال مجدد کد
   * @param activationId شناسه فعالسازی
   * @returns آیا عملیات با موفقیت انجام شد
   */
  async requestNewCode(activationId: number): Promise<boolean> {
    return this.setActivationStatus(activationId, ActivationOperation.RETRY);
  }

  /**
   * تنظیم مقدار فعال‌سازی کش
   * @param enabled وضعیت فعال‌سازی
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
  }

  /**
   * تنظیم مدت زمان اعتبار کش
   * @param ttl زمان اعتبار به ثانیه
   */
  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
  }

  /**
   * پاک کردن کش مربوط به این API
   */
  clearCache(): void {
    cache.delete(CACHE_KEYS.COUNTRIES);
    cache.delete(CACHE_KEYS.SERVICES);
    cache.delete(CACHE_KEYS.TOP_COUNTRIES);
    cache.delete(CACHE_KEYS.NUMBER_V2);
    logger.debug('کش مربوط به API پاک شد');
  }
}

// صادر کردن یک نمونه پیش‌فرض برای استفاده سریع
const productApi = new ProductApi();
export default productApi;
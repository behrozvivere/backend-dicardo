import axios from 'axios';
import { env } from '../../../config/env';

/**
 * نوع‌های مختلف منابع قیمت‌گذاری
 */
export enum PricingSourceType {
  API = 'api',
  MANUAL = 'manual',
}

/**
 * اینترفیس تنظیمات قیمت‌گذاری
 */
export interface PricingConfig {
  sourceType: PricingSourceType;
  manualRate?: number;
  profitMargin: number; // درصد سود (به عنوان مثال 10 برای 10%)
  apiCacheTTL: number; // مدت زمان کش به میلی‌ثانیه
}

/**
 * سرویس مدیریت قیمت‌گذاری
 * این سرویس نرخ ارز را از API یا مقدار دستی دریافت می‌کند و محاسبات قیمت را انجام می‌دهد
 */
export class PricingService {
  private config: PricingConfig;
  private cachedApiRate: number | null = null;
  private lastApiCallTime: number = 0;
  
  /**
   * سازنده کلاس
   * @param config تنظیمات قیمت‌گذاری
   */
  constructor(config?: Partial<PricingConfig>) {
    this.config = {
      sourceType: PricingSourceType.API,
      profitMargin: 10, // 10% سود پیش‌فرض
      apiCacheTTL: 3600000, // کش برای یک ساعت
      ...config
    };
  }
  
  /**
   * دریافت نرخ ارز از API ناواسان
   * @returns نرخ ارز بدست آمده از API
   */
  private async fetchRateFromAPI(): Promise<number> {
    try {
      // استفاده از URL کامل با توکن API در پارامتر کوئری
      const apiToken = env.navasan.apiToken || 'freeXnRfoB7Gom8xXLooJjfBR7Se1ASY'; // استفاده از توکن رایگان اگر توکن تنظیم نشده باشد
      const apiUrl = `https://api.navasan.tech/latest/?api_key=${apiToken}`;
      
      console.log('در حال دریافت نرخ ارز از API ناواسان...');
      const response = await axios.get(apiUrl);
      
      if (response.status === 200 && response.data) {
        console.log('پاسخ API ناواسان:', JSON.stringify(response.data, null, 2));
        
        // استخراج نرخ ارز از پاسخ API
        // بر اساس نمونه کد جاواسکریپت، نرخ فروش دلار در فیلد usd_sell قرار دارد
        // و خود usd_sell یک آبجکت است که شامل فیلد value است
        let rate: number;
        
        if (response.data.usd_sell && response.data.usd_sell.value) {
          // اگر usd_sell یک آبجکت باشد و دارای فیلد value باشد
          rate = parseFloat(response.data.usd_sell.value);
        } else if (response.data.usd_sell) {
          // اگر usd_sell مستقیماً یک مقدار عددی باشد
          rate = parseFloat(response.data.usd_sell);
        } else if (response.data.value) {
          // اگر مستقیماً value وجود داشته باشد
          rate = parseFloat(response.data.value);
        } else {
          // حالت پیش‌فرض برای API رایگان که فقط یک عدد را برمی‌گرداند
          throw new Error('ساختار پاسخ API ناواسان قابل شناسایی نیست');
        }
        
        if (isNaN(rate) || rate <= 0) {
          throw new Error('مقدار نرخ ارز نامعتبر است');
        }
        
        console.log(`نرخ ارز دریافت شده: ${rate} تومان`);
        
        // ذخیره در کش
        this.cachedApiRate = rate;
        this.lastApiCallTime = Date.now();
        
        return rate;
      } else {
        throw new Error(`خطا در دریافت نرخ ارز از API: ${response.status}`);
      }
    } catch (error) {
      console.error('خطا در دریافت نرخ ارز از API:', error);
      
      // در صورت خطا اگر نرخ کش شده داریم، از آن استفاده می‌کنیم
      if (this.cachedApiRate !== null) {
        console.warn('استفاده از مقدار کش شده');
        return this.cachedApiRate;
      }
      
      // در صورتی که هیچ نرخی در کش نباشد، از یک مقدار پیش فرض استفاده می‌کنیم
      console.warn('استفاده از نرخ پیش‌فرض: 83100 تومان');
      return 83100; // مقدار پیش‌فرض بر اساس داده نمونه
    }
  }
  
  /**
   * بررسی نیاز به بروزرسانی کش API
   * @returns آیا کش نیاز به بروزرسانی دارد؟
   */
  private shouldRefreshCache(): boolean {
    return (
      this.cachedApiRate === null || 
      Date.now() - this.lastApiCallTime > this.config.apiCacheTTL
    );
  }
  
  /**
   * دریافت نرخ ارز فعلی بر اساس تنظیمات
   * @returns نرخ ارز فعلی
   */
  public async getCurrentRate(): Promise<number> {
    if (this.config.sourceType === PricingSourceType.MANUAL) {
      // استفاده از نرخ دستی
      if (!this.config.manualRate || this.config.manualRate <= 0) {
        throw new Error('نرخ دستی تنظیم نشده یا نامعتبر است');
      }
      return this.config.manualRate;
    } else {
      // استفاده از API
      if (this.shouldRefreshCache()) {
        return this.fetchRateFromAPI();
      }
      return this.cachedApiRate!;
    }
  }
  
  /**
   * محاسبه قیمت نهایی با درصد سود
   * @param basePrice قیمت پایه
   * @returns قیمت با احتساب سود
   */
  public async calculatePriceWithProfit(basePrice: number): Promise<number> {
    const currentRate = await this.getCurrentRate();
    const profitFactor = 1 + (this.config.profitMargin / 100);
    return basePrice * currentRate * profitFactor;
  }
  
  /**
   * تغییر نوع منبع قیمت‌گذاری
   * @param sourceType نوع منبع جدید
   * @param manualRate نرخ دستی (اختیاری، فقط برای حالت دستی)
   */
  public setSource(sourceType: PricingSourceType, manualRate?: number): void {
    this.config.sourceType = sourceType;
    
    if (sourceType === PricingSourceType.MANUAL && manualRate !== undefined) {
      this.config.manualRate = manualRate;
    }
  }
  
  /**
   * تنظیم درصد سود
   * @param margin درصد سود جدید
   */
  public setProfitMargin(margin: number): void {
    if (margin < 0) {
      throw new Error('درصد سود نمی‌تواند منفی باشد');
    }
    this.config.profitMargin = margin;
  }
  
  /**
   * دریافت تنظیمات فعلی قیمت‌گذاری
   * @returns تنظیمات فعلی
   */
  public getConfig(): PricingConfig {
    return { ...this.config };
  }
}

/**
 * ایجاد یک نمونه پیش‌فرض از سرویس قیمت‌گذاری
 */
export const defaultPricingService = new PricingService();

export default PricingService;
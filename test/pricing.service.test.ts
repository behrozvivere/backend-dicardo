/**
 * فایل تست برای pricing.service.ts
 * 
 * این فایل عملکرد سرویس قیمت‌گذاری را تست می‌کند و نرخ ثابت، نرخ API و درصد سود را بررسی می‌کند.
 */

import { PricingService, PricingSourceType } from '../src/modules/products/services/pricing.service';
import axios from 'axios';
import { env } from '../src/config/env';

// تعریف کدهای رنگی برای خروجی کنسول
const COLOR = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  BOLD: '\x1b[1m',
};

// Override axios get method to simulate API response
const originalAxiosGet = axios.get;
axios.get = async function mockGet(url: string, config?: any): Promise<any> {
  console.log(`${COLOR.CYAN}🔄 Simulating API call to: ${url}${COLOR.RESET}`);
  // Return simulated API response
  return {
    status: 200,
    data: { value: "83100" } // شبیه سازی پاسخ API با مقدار 83100
  };
};

/**
 * تابع اصلی برای تست کردن سرویس قیمت‌گذاری
 */
async function testPricingService() {
  console.log(`${COLOR.BOLD}${COLOR.BLUE}=== شروع تست سرویس قیمت‌گذاری ===${COLOR.RESET}`);
  
  try {
    // آزمایش 1: تست نرخ API
    console.log(`\n${COLOR.BOLD}${COLOR.CYAN}=== تست 1: دریافت نرخ از API ===${COLOR.RESET}`);
    const apiPricingService = new PricingService({
      sourceType: PricingSourceType.API,
      profitMargin: 10 // 10% سود
    });
    
    console.log(`تنظیمات پیکربندی: ${JSON.stringify(apiPricingService.getConfig(), null, 2)}`);
    console.log('در حال دریافت نرخ از API...');
    
    const startTimeAPI = Date.now();
    const apiRate = await apiPricingService.getCurrentRate();
    const endTimeAPI = Date.now();
    
    console.log(`${COLOR.GREEN}✅ نرخ دریافت شده از API: ${apiRate} (${endTimeAPI - startTimeAPI} میلی‌ثانیه)${COLOR.RESET}`);
    
    // محاسبه قیمت با سود
    const basePriceForAPI = 100;
    const finalPriceAPI = await apiPricingService.calculatePriceWithProfit(basePriceForAPI);
    console.log(`${COLOR.YELLOW}📊 قیمت پایه: ${basePriceForAPI}${COLOR.RESET}`);
    console.log(`${COLOR.YELLOW}📈 قیمت با اعمال سود (${apiPricingService.getConfig().profitMargin}%): ${finalPriceAPI}${COLOR.RESET}`);
    
    // آزمایش 2: تست نرخ ثابت (دستی)
    console.log(`\n${COLOR.BOLD}${COLOR.CYAN}=== تست 2: استفاده از نرخ دستی ===${COLOR.RESET}`);
    const manualPricingService = new PricingService({
      sourceType: PricingSourceType.MANUAL,
      manualRate: 85000, // نرخ دستی 85000
      profitMargin: 15 // 15% سود
    });
    
    console.log(`تنظیمات پیکربندی: ${JSON.stringify(manualPricingService.getConfig(), null, 2)}`);
    
    const manualRate = await manualPricingService.getCurrentRate();
    console.log(`${COLOR.GREEN}✅ نرخ دستی: ${manualRate}${COLOR.RESET}`);
    
    // محاسبه قیمت با سود
    const basePriceForManual = 100;
    const finalPriceManual = await manualPricingService.calculatePriceWithProfit(basePriceForManual);
    console.log(`${COLOR.YELLOW}📊 قیمت پایه: ${basePriceForManual}${COLOR.RESET}`);
    console.log(`${COLOR.YELLOW}📈 قیمت با اعمال سود (${manualPricingService.getConfig().profitMargin}%): ${finalPriceManual}${COLOR.RESET}`);
    
    // آزمایش 3: تغییر پیکربندی در زمان اجرا
    console.log(`\n${COLOR.BOLD}${COLOR.CYAN}=== تست 3: تغییر پیکربندی در زمان اجرا ===${COLOR.RESET}`);
    const dynamicPricingService = new PricingService({
      sourceType: PricingSourceType.API,
      profitMargin: 10 // 10% سود اولیه
    });
    
    console.log(`تنظیمات اولیه: ${JSON.stringify(dynamicPricingService.getConfig(), null, 2)}`);
    console.log('تغییر به نرخ دستی و افزایش درصد سود...');
    
    // تغییر نوع منبع به دستی
    dynamicPricingService.setSource(PricingSourceType.MANUAL, 90000);
    // تغییر درصد سود
    dynamicPricingService.setProfitMargin(20);
    
    console.log(`تنظیمات جدید: ${JSON.stringify(dynamicPricingService.getConfig(), null, 2)}`);
    
    const updatedRate = await dynamicPricingService.getCurrentRate();
    console.log(`${COLOR.GREEN}✅ نرخ جدید (دستی): ${updatedRate}${COLOR.RESET}`);
    
    // محاسبه قیمت با سود جدید
    const basePriceForDynamic = 100;
    const finalPriceDynamic = await dynamicPricingService.calculatePriceWithProfit(basePriceForDynamic);
    console.log(`${COLOR.YELLOW}📊 قیمت پایه: ${basePriceForDynamic}${COLOR.RESET}`);
    console.log(`${COLOR.YELLOW}📈 قیمت با اعمال سود جدید (${dynamicPricingService.getConfig().profitMargin}%): ${finalPriceDynamic}${COLOR.RESET}`);
    
    // آزمایش 4: مقایسه قیمت‌های نهایی
    console.log(`\n${COLOR.BOLD}${COLOR.CYAN}=== تست 4: مقایسه قیمت‌های نهایی ===${COLOR.RESET}`);
    console.log(`${COLOR.MAGENTA}📊 قیمت پایه مشترک: 100${COLOR.RESET}`);
    console.log(`${COLOR.MAGENTA}📈 قیمت نهایی با نرخ API و سود 10%: ${finalPriceAPI}${COLOR.RESET}`);
    console.log(`${COLOR.MAGENTA}📈 قیمت نهایی با نرخ دستی 85000 و سود 15%: ${finalPriceManual}${COLOR.RESET}`);
    console.log(`${COLOR.MAGENTA}📈 قیمت نهایی با نرخ دستی 90000 و سود 20%: ${finalPriceDynamic}${COLOR.RESET}`);
    
    // تست کش سرویس API
    console.log(`\n${COLOR.BOLD}${COLOR.CYAN}=== تست 5: بررسی کش سرویس API ===${COLOR.RESET}`);
    console.log('فراخوانی مجدد API با کش فعال...');
    
    const cacheStartTime = Date.now();
    const cachedRate = await apiPricingService.getCurrentRate();
    const cacheEndTime = Date.now();
    
    console.log(`${COLOR.GREEN}✅ نرخ دریافت شده از کش: ${cachedRate} (${cacheEndTime - cacheStartTime} میلی‌ثانیه)${COLOR.RESET}`);
    
    if (endTimeAPI - startTimeAPI > 0 && cacheEndTime - cacheStartTime > 0) {
      const improvement = Math.round((endTimeAPI - startTimeAPI - (cacheEndTime - cacheStartTime)) / (endTimeAPI - startTimeAPI) * 100);
      console.log(`${COLOR.GREEN}📈 بهبود سرعت با استفاده از کش: ${improvement}%${COLOR.RESET}`);
    }
    
    console.log(`\n${COLOR.BOLD}${COLOR.GREEN}=== تست سرویس قیمت‌گذاری با موفقیت انجام شد ===${COLOR.RESET}`);
    
    // Restore original axios get method
    axios.get = originalAxiosGet;
    
  } catch (error: unknown) {
    // Restore original axios get method even on error
    axios.get = originalAxiosGet;
    
    console.error(`${COLOR.RED}❌ خطا در اجرای تست:${COLOR.RESET}`);
    if (error instanceof Error) {
      console.error(`${COLOR.RED}پیام خطا: ${error.message}${COLOR.RESET}`);
      console.error(`${COLOR.RED}استک خطا: ${error.stack}${COLOR.RESET}`);
    } else {
      console.error(`${COLOR.RED}${String(error)}${COLOR.RESET}`);
    }
    process.exit(1);
  }
}

// اجرای تست
testPricingService()
  .then(() => console.log(`${COLOR.GREEN}✅ تمام تست‌ها با موفقیت انجام شدند${COLOR.RESET}`))
  .catch((error: unknown) => {
    console.error(`${COLOR.RED}❌ خطای نهایی:${COLOR.RESET}`, error);
    process.exit(1);
  });
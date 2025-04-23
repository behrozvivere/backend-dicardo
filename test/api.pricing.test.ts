/**
 * تست دریافت نرخ ارز از API ناواسان و محاسبه قیمت تومانی
 * 
 * این تست وضعیت واقعی برنامه را در محیط تولید شبیه‌سازی می‌کند
 * و بررسی می‌کند که آیا دریافت نرخ از API ناواسان به درستی انجام می‌شود.
 */

import { PricingService, PricingSourceType } from '../src/modules/products/services/pricing.service';
import ProductMapper from '../src/modules/products/external/product.mapper';
import { 
  RawTopCountryData,
} from '../src/types';

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

/**
 * تابع اصلی برای تست دریافت نرخ ارز از API ناواسان
 */
async function testNavasanAPIRate() {
  console.log(`${COLOR.BOLD}${COLOR.BLUE}=== شروع تست دریافت نرخ ارز از API ناواسان ===${COLOR.RESET}`);
  
  try {
    // ایجاد یک نمونه از سرویس قیمت‌گذاری با تنظیمات پیش‌فرض (استفاده از API)
    const pricingService = new PricingService();
    
    console.log(`${COLOR.CYAN}تنظیمات سرویس قیمت‌گذاری:${COLOR.RESET}`);
    const config = pricingService.getConfig();
    console.log(`• نوع منبع: ${COLOR.YELLOW}${config.sourceType === PricingSourceType.API ? 'API ناواسان' : 'دستی'}${COLOR.RESET}`);
    console.log(`• درصد سود: ${COLOR.YELLOW}${config.profitMargin}%${COLOR.RESET}`);
    
    // === بخش اول: دریافت مستقیم نرخ ارز از API ===
    console.log(`\n${COLOR.BOLD}${COLOR.CYAN}=== تست 1: دریافت مستقیم نرخ ارز از API ناواسان ===${COLOR.RESET}`);
    
    console.log('در حال دریافت نرخ ارز از API ناواسان...');
    
    // متغیرهای زمان خارج از بلوک try داخلی تعریف می‌شوند تا در بلوک‌های بعدی هم قابل دسترسی باشند
    let apiStartTime = Date.now();
    let apiEndTime = 0;
    let rateFromApi = 0;
    
    try {
      rateFromApi = await pricingService.getCurrentRate();
      apiEndTime = Date.now();
      
      console.log(`${COLOR.GREEN}✅ نرخ دریافت شده از API: ${rateFromApi.toLocaleString()} تومان (${apiEndTime - apiStartTime} میلی‌ثانیه)${COLOR.RESET}`);
      
      // محاسبه قیمت یک نمونه محصول با نرخ دریافتی
      const samplePrice = 0.20; // قیمت نمونه: 0.20 دلار
      const finalPrice = await pricingService.calculatePriceWithProfit(samplePrice);
      
      console.log(`• قیمت دلاری نمونه: ${COLOR.YELLOW}$${samplePrice}${COLOR.RESET}`);
      console.log(`• نرخ تبدیل دریافتی از API: ${COLOR.YELLOW}${rateFromApi.toLocaleString()} تومان${COLOR.RESET}`);
      console.log(`• درصد سود اعمال شده: ${COLOR.YELLOW}${config.profitMargin}%${COLOR.RESET}`);
      console.log(`• قیمت نهایی محصول: ${COLOR.YELLOW}${finalPrice.toLocaleString()} تومان${COLOR.RESET}`);
      
      // بررسی درستی محاسبه
      const expectedPrice = samplePrice * rateFromApi * (1 + config.profitMargin / 100);
      const isCalculationCorrect = Math.abs(finalPrice - expectedPrice) < 1; // با اختلاف کمتر از 1 تومان به دلیل رند کردن
      
      if (isCalculationCorrect) {
        console.log(`${COLOR.GREEN}✅ محاسبه قیمت با نرخ API صحیح است${COLOR.RESET}`);
      } else {
        console.log(`${COLOR.RED}❌ خطا در محاسبه قیمت. مقدار مورد انتظار: ${expectedPrice.toLocaleString()} تومان${COLOR.RESET}`);
      }
      
    } catch (error) {
      console.error(`${COLOR.RED}❌ خطا در دریافت نرخ از API:${COLOR.RESET}`, error);
      console.log(`${COLOR.YELLOW}⚠️ این خطا ممکن است به دلیل عدم دسترسی به API ناواسان در محیط تست باشد.${COLOR.RESET}`);
      console.log(`${COLOR.YELLOW}⚠️ در محیط واقعی، اگر توکن API معتبر تنظیم شده باشد، این خطا رخ نخواهد داد.${COLOR.RESET}`);
    }
    
    // === بخش دوم: بررسی کش API ===
    // کش باید با اولین درخواست پر شده باشد، پس بررسی می‌کنیم آیا کش فعال است
    if (rateFromApi > 0) {
      console.log(`\n${COLOR.BOLD}${COLOR.CYAN}=== تست 2: بررسی کش API ناواسان ===${COLOR.RESET}`);
      
      console.log('در حال فراخوانی مجدد API با کش فعال...');
      
      const cacheStartTime = Date.now();
      const cachedRate = await pricingService.getCurrentRate();
      const cacheEndTime = Date.now();
      
      console.log(`${COLOR.GREEN}✅ نرخ دریافت شده از کش: ${cachedRate.toLocaleString()} تومان (${cacheEndTime - cacheStartTime} میلی‌ثانیه)${COLOR.RESET}`);
      
      if (apiEndTime > 0 && cacheEndTime - cacheStartTime < apiEndTime - apiStartTime) {
        const improvement = Math.round(((apiEndTime - apiStartTime) - (cacheEndTime - cacheStartTime)) / (apiEndTime - apiStartTime) * 100);
        console.log(`${COLOR.GREEN}📈 بهبود سرعت با استفاده از کش: ${improvement}%${COLOR.RESET}`);
      }
    }
    
    // === بخش سوم: استفاده از نرخ API در mapper ===
    console.log(`\n${COLOR.BOLD}${COLOR.CYAN}=== تست 3: استفاده از نرخ API در ProductMapper ===${COLOR.RESET}`);
    
    console.log(`تنظیم سرویس قیمت‌گذاری در مپر محصولات...`);
    ProductMapper.setPricingService(pricingService);
    
    // داده نمونه برای یک کشور/سرویس
    const rawTopCountryData: RawTopCountryData = {
      country: 1,
      count: 1000,
      price: 0.20,  // قیمت دلاری: 0.20 دلار
      retail_price: 0.25
    };
    
    const serviceCode = 'tg';
    
    try {
      // فراخوانی مپر
      const countryService = await ProductMapper.mapCountryService(rawTopCountryData, serviceCode);
      
      console.log(`• کد سرویس: ${COLOR.YELLOW}${serviceCode}${COLOR.RESET}`);
      console.log(`• شناسه کشور: ${COLOR.YELLOW}${countryService.countryId}${COLOR.RESET}`);
      console.log(`• قیمت دلاری: ${COLOR.YELLOW}$${countryService.price}${COLOR.RESET}`);
      console.log(`• قیمت تومانی محاسبه شده: ${COLOR.YELLOW}${countryService.priceIRT?.toLocaleString() || 'نامشخص'} تومان${COLOR.RESET}`);
      
      if (countryService.priceIRT && countryService.priceIRT > 0) {
        console.log(`${COLOR.GREEN}✅ محاسبه قیمت تومانی در مپر با استفاده از نرخ API انجام شد${COLOR.RESET}`);
        
        // محاسبه مقدار مورد انتظار
        const currentRate = await pricingService.getCurrentRate();
        const expectedMapperPrice = Math.round(rawTopCountryData.price * currentRate * (1 + config.profitMargin / 100));
        
        // مقایسه مقدار محاسبه شده با مقدار مورد انتظار
        if (Math.abs(countryService.priceIRT - expectedMapperPrice) < 1) {
          console.log(`${COLOR.GREEN}✅ قیمت محاسبه شده در مپر با نرخ API مطابقت دارد${COLOR.RESET}`);
          console.log(`• مقدار مورد انتظار: ${COLOR.YELLOW}${expectedMapperPrice.toLocaleString()} تومان${COLOR.RESET}`);
          console.log(`• مقدار واقعی: ${COLOR.YELLOW}${countryService.priceIRT.toLocaleString()} تومان${COLOR.RESET}`);
        } else {
          console.log(`${COLOR.RED}❌ قیمت محاسبه شده در مپر با نرخ API مطابقت ندارد${COLOR.RESET}`);
          console.log(`• مقدار مورد انتظار: ${COLOR.YELLOW}${expectedMapperPrice.toLocaleString()} تومان${COLOR.RESET}`);
          console.log(`• مقدار واقعی: ${COLOR.YELLOW}${countryService.priceIRT.toLocaleString()} تومان${COLOR.RESET}`);
        }
      } else {
        console.log(`${COLOR.RED}❌ خطا در محاسبه قیمت تومانی در مپر${COLOR.RESET}`);
      }
    } catch (error) {
      console.error(`${COLOR.RED}❌ خطا در فراخوانی مپر:${COLOR.RESET}`, error);
    }

    // === بخش چهارم: تست محاسبه قیمت برای Activation ===
    console.log(`\n${COLOR.BOLD}${COLOR.CYAN}=== تست 4: محاسبه قیمت تومانی برای Activation ===${COLOR.RESET}`);
    
    try {
      // داده نمونه برای فعال‌سازی
      const activationCost = 0.25; // هزینه فعال‌سازی: 0.25 دلار
      
      // محاسبه مستقیم قیمت تومانی
      const activationPriceIRT = await pricingService.calculatePriceWithProfit(activationCost);
      
      console.log(`• هزینه فعال‌سازی (دلاری): ${COLOR.YELLOW}$${activationCost}${COLOR.RESET}`);
      console.log(`• قیمت تومانی محاسبه شده: ${COLOR.YELLOW}${activationPriceIRT.toLocaleString()} تومان${COLOR.RESET}`);
      
      if (activationPriceIRT > 0) {
        console.log(`${COLOR.GREEN}✅ محاسبه قیمت تومانی برای فعال‌سازی انجام شد${COLOR.RESET}`);
      } else {
        console.log(`${COLOR.RED}❌ خطا در محاسبه قیمت تومانی برای فعال‌سازی${COLOR.RESET}`);
      }
    } catch (error) {
      console.error(`${COLOR.RED}❌ خطا در محاسبه قیمت تومانی برای فعال‌سازی:${COLOR.RESET}`, error);
    }
    
    // نتیجه کلی تست
    console.log(`\n${COLOR.BOLD}${COLOR.CYAN}=== نتیجه کلی تست ===${COLOR.RESET}`);
    
    const rate = await pricingService.getCurrentRate();
    if (rate > 0) {
      console.log(`${COLOR.GREEN}✅ سیستم با موفقیت نرخ ارز را دریافت کرد.${COLOR.RESET}`);
      console.log(`${COLOR.GREEN}✅ نرخ ارز نهایی: ${rate.toLocaleString()} تومان${COLOR.RESET}`);
      
      if (rate === 83100) {
        console.log(`${COLOR.YELLOW}⚠️ توجه: مقدار فعلی برابر با مقدار پیش‌فرض (83100) است.${COLOR.RESET}`);
        console.log(`${COLOR.YELLOW}⚠️ این ممکن است به معنای استفاده از مقدار پیش‌فرض به جای دریافت از API باشد.${COLOR.RESET}`);
      }
    } else {
      console.log(`${COLOR.RED}❌ مشکل در دریافت نرخ ارز.${COLOR.RESET}`);
      console.log(`${COLOR.YELLOW}⚠️ اطمینان حاصل کنید که توکن API در فایل .env به درستی تنظیم شده باشد.${COLOR.RESET}`);
    }
    
  } catch (error: unknown) {
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
testNavasanAPIRate()
  .then(() => console.log(`${COLOR.GREEN}✅ تست کامل شد${COLOR.RESET}`))
  .catch((error: unknown) => {
    console.error(`${COLOR.RED}❌ خطای نهایی:${COLOR.RESET}`, error);
    process.exit(1);
  });
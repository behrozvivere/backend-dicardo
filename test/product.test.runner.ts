/**
 * فایل اجراکننده تست برای API های مختلف در product.api.ts
 * 
 * این فایل امکان اجرای تست‌های مختلف را به صورت مجزا فراهم می‌کند
 * تا بتوانید هر گروه از API ها را جداگانه تست کنید.
 */

import { productApi, CountryData, Service, TopCountryData } from '../src/modules/products/external';

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
  DIM: '\x1b[2m',
};

/**
 * نمایش منوی انتخاب تست
 */
function showMenu(): void {
  console.log(`
${COLOR.BOLD}${COLOR.CYAN}=== منوی تست API های سرویس SMS-Activate ===${COLOR.RESET}

  ${COLOR.YELLOW}1.${COLOR.RESET} تست دریافت لیست کشورها
  ${COLOR.YELLOW}2.${COLOR.RESET} تست دریافت لیست سرویس‌ها
  ${COLOR.YELLOW}3.${COLOR.RESET} تست دریافت کشورهای برتر برای سرویس VK
  ${COLOR.YELLOW}4.${COLOR.RESET} تست دریافت کشورهای برتر برای همه سرویس‌ها
  ${COLOR.YELLOW}5.${COLOR.RESET} تست دریافت کشورهای برتر با قیمت آزاد
  ${COLOR.YELLOW}6.${COLOR.RESET} تست دریافت سرویس‌ها برای یک کشور خاص
  ${COLOR.YELLOW}0.${COLOR.RESET} خروج

لطفاً شماره تست مورد نظر را وارد کنید: `);
}

/**
 * دریافت ورودی از کاربر
 */
async function getUserInput(): Promise<number> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question('', (answer: string) => {
      readline.close();
      resolve(parseInt(answer, 10) || 0);
    });
  });
}

/**
 * تست دریافت لیست کشورها
 */
async function testGetCountries(): Promise<void> {
  console.log(`\n${COLOR.BOLD}${COLOR.BLUE}=== شروع تست دریافت لیست کشورها ===${COLOR.RESET}`);
  
  try {
    // پاک کردن کش قبلی برای اطمینان از دریافت داده‌های جدید
    productApi.clearCache();
    
    console.log('در حال دریافت لیست کشورها...');
    const startTime = Date.now();
    const countries = await productApi.getCountries();
    const endTime = Date.now();
    
    // نمایش زمان اجرا
    console.log(`${COLOR.GREEN}✅ لیست کشورها با موفقیت دریافت شد (${endTime - startTime} میلی‌ثانیه)${COLOR.RESET}`);
    
    // نمایش تعداد کشورها
    const countryCount = Object.keys(countries).length;
    console.log(`${COLOR.CYAN}📊 تعداد کل کشورهای دریافت شده: ${countryCount}${COLOR.RESET}`);
    
    if (countryCount > 0) {
      // نمایش چند کشور به عنوان نمونه
      console.log(`\n${COLOR.BOLD}=== نمونه کشورها ===${COLOR.RESET}`);
      const sampleCountries = Object.entries(countries).slice(0, 5);
      
      sampleCountries.forEach(([key, country]) => {
        if (typeof country === 'object' && country !== null) {
          console.log(`${COLOR.YELLOW}🌍 کشور با کلید ${key}:${COLOR.RESET}`);
          
          // بررسی و نمایش مقادیر مختلف با در نظر گرفتن اینکه ممکن است تعریف نشده باشند
          console.log(`   - شناسه: ${country.id || 'تعریف نشده'}`);
          console.log(`   - نام انگلیسی: ${country.eng || 'تعریف نشده'}`);
          console.log(`   - نام روسی: ${country.rus || 'تعریف نشده'}`);
          console.log(`   - وضعیت نمایش: ${country.visible === 1 ? 'فعال' : 'غیرفعال'}`);
        } else {
          console.log(`${COLOR.YELLOW}🌍 کشور با کلید ${key}: ${country}${COLOR.RESET}`);
        }
      });
    } else {
      console.log(`${COLOR.YELLOW}⚠️ هیچ کشوری دریافت نشد یا فرمت پاسخ متفاوت است.${COLOR.RESET}`);
      console.log('پاسخ دریافتی:');
      console.log(countries);
    }
    
    // تست کش
    console.log(`\n${COLOR.BOLD}=== تست کش ===${COLOR.RESET}`);
    console.log('در حال فراخوانی مجدد API با کش فعال...');
    const cacheStartTime = Date.now();
    await productApi.getCountries();
    const cacheEndTime = Date.now();
    
    console.log(`${COLOR.GREEN}✅ فراخوانی دوم انجام شد (${cacheEndTime - cacheStartTime} میلی‌ثانیه)${COLOR.RESET}`);
    if (endTime - startTime > 0) {
      console.log(`${COLOR.GREEN}📈 بهبود سرعت با استفاده از کش: ${Math.round((endTime - startTime - (cacheEndTime - cacheStartTime)) / (endTime - startTime) * 100)}%${COLOR.RESET}`);
    }
    
  } catch (error: unknown) {
    console.error(`${COLOR.RED}❌ خطا در اجرای تست:${COLOR.RESET}`);
    if (error instanceof Error) {
      console.error(`${COLOR.RED}پیام خطا: ${error.message}${COLOR.RESET}`);
      console.error(`${COLOR.DIM}استک خطا: ${error.stack}${COLOR.RESET}`);
    } else {
      console.error(`${COLOR.RED}${String(error)}${COLOR.RESET}`);
    }
  }
}

/**
 * تست دریافت لیست سرویس‌ها
 */
async function testGetServicesList(): Promise<void> {
  console.log(`\n${COLOR.BOLD}${COLOR.BLUE}=== شروع تست دریافت فهرست سرویس‌ها ===${COLOR.RESET}`);
  
  try {
    // پاک کردن کش قبلی برای اطمینان از دریافت داده‌های جدید
    productApi.clearCache();
    
    // دریافت فهرست سرویس‌ها بدون پارامترهای اختیاری
    console.log('در حال دریافت فهرست تمام سرویس‌ها...');
    const startTime = Date.now();
    const servicesResult = await productApi.getServicesList();
    const endTime = Date.now();
    
    // نمایش زمان اجرا
    console.log(`${COLOR.GREEN}✅ فهرست سرویس‌ها با موفقیت دریافت شد (${endTime - startTime} میلی‌ثانیه)${COLOR.RESET}`);
    
    // نمایش تعداد سرویس‌ها
    if (servicesResult.services && Array.isArray(servicesResult.services)) {
      console.log(`${COLOR.CYAN}📊 تعداد کل سرویس‌های دریافت شده: ${servicesResult.services.length}${COLOR.RESET}`);
      
      // نمایش چند سرویس به عنوان نمونه
      console.log(`\n${COLOR.BOLD}=== نمونه سرویس‌ها ===${COLOR.RESET}`);
      const sampleServices = servicesResult.services.slice(0, 10);
      sampleServices.forEach((service: Service) => {
        console.log(`${COLOR.YELLOW}🔹 کد: ${service.code}${COLOR.RESET}`);
        console.log(`   - نام: ${service.name}`);
      });
    } else {
      console.log(`${COLOR.YELLOW}❌ ساختار پاسخ API نامعتبر است:${COLOR.RESET}`, servicesResult);
    }
    
    // تست کش
    console.log(`\n${COLOR.BOLD}=== تست کش ===${COLOR.RESET}`);
    console.log('در حال فراخوانی مجدد API با کش فعال...');
    const cacheStartTime = Date.now();
    await productApi.getServicesList();
    const cacheEndTime = Date.now();
    
    console.log(`${COLOR.GREEN}✅ فراخوانی دوم انجام شد (${cacheEndTime - cacheStartTime} میلی‌ثانیه)${COLOR.RESET}`);
    if (endTime - startTime > 0) {
      console.log(`${COLOR.GREEN}📈 بهبود سرعت با استفاده از کش: ${Math.round((endTime - startTime - (cacheEndTime - cacheStartTime)) / (endTime - startTime) * 100)}%${COLOR.RESET}`);
    }
    
  } catch (error: unknown) {
    console.error(`${COLOR.RED}❌ خطا در اجرای تست:${COLOR.RESET}`);
    if (error instanceof Error) {
      console.error(`${COLOR.RED}پیام خطا: ${error.message}${COLOR.RESET}`);
      console.error(`${COLOR.DIM}استک خطا: ${error.stack}${COLOR.RESET}`);
    } else {
      console.error(`${COLOR.RED}${String(error)}${COLOR.RESET}`);
    }
  }
}

/**
 * تست دریافت سرویس‌ها برای یک کشور خاص
 */
async function testGetServicesForCountry(): Promise<void> {
  console.log(`\n${COLOR.BOLD}${COLOR.BLUE}=== شروع تست دریافت فهرست سرویس‌ها برای یک کشور خاص ===${COLOR.RESET}`);
  
  try {
    // پاک کردن کش قبلی برای اطمینان از دریافت داده‌های جدید
    productApi.clearCache();
    
    const countryId = 0; // شناسه کشور (به عنوان مثال روسیه)
    const language = 'ru'; // زبان روسی
    
    console.log(`در حال دریافت سرویس‌های کشور با کد ${countryId} به زبان ${language}...`);
    const startTime = Date.now();
    const servicesResult = await productApi.getServicesList(countryId, language);
    const endTime = Date.now();
    
    // نمایش زمان اجرا
    console.log(`${COLOR.GREEN}✅ فهرست سرویس‌ها با موفقیت دریافت شد (${endTime - startTime} میلی‌ثانیه)${COLOR.RESET}`);
    
    // نمایش تعداد سرویس‌ها
    if (servicesResult.services && Array.isArray(servicesResult.services)) {
      console.log(`${COLOR.CYAN}📊 تعداد کل سرویس‌های دریافت شده برای کشور: ${servicesResult.services.length}${COLOR.RESET}`);
      
      // نمایش چند سرویس به عنوان نمونه
      console.log(`\n${COLOR.BOLD}=== نمونه سرویس‌ها برای کشور ===${COLOR.RESET}`);
      const sampleServices = servicesResult.services.slice(0, 10);
      sampleServices.forEach((service: Service) => {
        console.log(`${COLOR.YELLOW}🔹 کد: ${service.code}${COLOR.RESET}`);
        console.log(`   - نام: ${service.name}`);
      });
    } else {
      console.log(`${COLOR.YELLOW}❌ ساختار پاسخ API نامعتبر است:${COLOR.RESET}`, servicesResult);
    }
    
  } catch (error: unknown) {
    console.error(`${COLOR.RED}❌ خطا در اجرای تست:${COLOR.RESET}`);
    if (error instanceof Error) {
      console.error(`${COLOR.RED}پیام خطا: ${error.message}${COLOR.RESET}`);
      console.error(`${COLOR.DIM}استک خطا: ${error.stack}${COLOR.RESET}`);
    } else {
      console.error(`${COLOR.RED}${String(error)}${COLOR.RESET}`);
    }
  }
}

/**
 * تست دریافت کشورهای برتر برای سرویس VK
 */
async function testGetVKTopCountries(): Promise<void> {
  console.log(`\n${COLOR.BOLD}${COLOR.BLUE}=== شروع تست دریافت کشورهای برتر برای سرویس VK ===${COLOR.RESET}`);
  
  try {
    // پاک کردن کش قبلی برای اطمینان از دریافت داده‌های جدید
    productApi.clearCache();
    
    // کد سرویس VK
    const serviceCode = 'vk';
    
    // دریافت کشورهای برتر برای سرویس VK
    console.log(`در حال دریافت کشورهای برتر برای سرویس "${serviceCode}"...`);
    const startTime = Date.now();
    const vkTopCountries = await productApi.getTopCountriesByService(serviceCode);
    const endTime = Date.now();
    
    // نمایش زمان اجرا
    console.log(`${COLOR.GREEN}✅ لیست کشورهای برتر با موفقیت دریافت شد (${endTime - startTime} میلی‌ثانیه)${COLOR.RESET}`);
    
    // نمایش تعداد کشورهای برتر
    const countryCount = Object.keys(vkTopCountries).length;
    console.log(`${COLOR.CYAN}📊 تعداد کشورهای برتر برای سرویس VK: ${countryCount}${COLOR.RESET}`);
    
    if (countryCount === 0) {
      console.log(`${COLOR.YELLOW}⚠️ هیچ کشور برتری برای سرویس VK یافت نشد.${COLOR.RESET}`);
    } else {
      // نمایش جدول کشورهای برتر
      console.log(`\n${COLOR.BOLD}=== جدول کشورهای برتر برای سرویس VK ===${COLOR.RESET}`);
      console.log(`${COLOR.DIM}کد کشور | تعداد | قیمت | قیمت خرده‌فروشی${COLOR.RESET}`);
      console.log(`${COLOR.DIM}${'-'.repeat(50)}${COLOR.RESET}`);
      
      Object.entries(vkTopCountries).forEach(([key, data]) => {
        console.log(`${COLOR.YELLOW}${data.country.toString().padStart(8, ' ')} | ${data.count.toString().padStart(6, ' ')} | ${data.price.toFixed(2).padStart(5, ' ')} | ${data.retail_price.toFixed(2).padStart(5, ' ')}${COLOR.RESET}`);
      });
      
      // محاسبه برخی آمارها
      const totalCount = Object.values(vkTopCountries).reduce((sum, data) => sum + data.count, 0);
      const avgPrice = Object.values(vkTopCountries).reduce((sum, data) => sum + data.price, 0) / countryCount;
      
      console.log(`\n${COLOR.BOLD}=== آمار کلی ===${COLOR.RESET}`);
      console.log(`${COLOR.CYAN}🔢 مجموع تعداد: ${totalCount}${COLOR.RESET}`);
      console.log(`${COLOR.CYAN}💰 میانگین قیمت: ${avgPrice.toFixed(2)}${COLOR.RESET}`);
    }
    
    // تست کش
    console.log(`\n${COLOR.BOLD}=== تست کش ===${COLOR.RESET}`);
    console.log('در حال فراخوانی مجدد API با کش فعال...');
    const cacheStartTime = Date.now();
    await productApi.getTopCountriesByService(serviceCode);
    const cacheEndTime = Date.now();
    
    console.log(`${COLOR.GREEN}✅ فراخوانی دوم انجام شد (${cacheEndTime - cacheStartTime} میلی‌ثانیه)${COLOR.RESET}`);
    if (endTime - startTime > 0) {
      console.log(`${COLOR.GREEN}📈 بهبود سرعت با استفاده از کش: ${Math.round((endTime - startTime - (cacheEndTime - cacheStartTime)) / (endTime - startTime) * 100)}%${COLOR.RESET}`);
    }
    
  } catch (error: unknown) {
    console.error(`${COLOR.RED}❌ خطا در اجرای تست:${COLOR.RESET}`);
    if (error instanceof Error) {
      console.error(`${COLOR.RED}پیام خطا: ${error.message}${COLOR.RESET}`);
      console.error(`${COLOR.DIM}استک خطا: ${error.stack}${COLOR.RESET}`);
    } else {
      console.error(`${COLOR.RED}${String(error)}${COLOR.RESET}`);
    }
  }
}

/**
 * تست دریافت کشورهای برتر برای تمام سرویس‌ها
 */
async function testGetAllTopCountries(): Promise<void> {
  console.log(`\n${COLOR.BOLD}${COLOR.BLUE}=== شروع تست دریافت کشورهای برتر برای تمام سرویس‌ها ===${COLOR.RESET}`);
  
  try {
    // پاک کردن کش قبلی برای اطمینان از دریافت داده‌های جدید
    productApi.clearCache();
    
    // دریافت کشورهای برتر برای تمام سرویس‌ها
    console.log('در حال دریافت کشورهای برتر برای تمام سرویس‌ها...');
    const startTime = Date.now();
    const allTopCountries = await productApi.getTopCountriesByService();
    const endTime = Date.now();
    
    // نمایش زمان اجرا
    console.log(`${COLOR.GREEN}✅ لیست کشورهای برتر با موفقیت دریافت شد (${endTime - startTime} میلی‌ثانیه)${COLOR.RESET}`);
    
    // نمایش تعداد کشورهای برتر
    const countryCount = Object.keys(allTopCountries).length;
    console.log(`${COLOR.CYAN}📊 تعداد کل کشورهای برتر دریافت شده: ${countryCount}${COLOR.RESET}`);
    
    if (countryCount === 0) {
      console.log(`${COLOR.YELLOW}⚠️ هیچ کشور برتری یافت نشد.${COLOR.RESET}`);
    } else {
      // نمایش جدول چند کشور برتر به عنوان نمونه
      console.log(`\n${COLOR.BOLD}=== نمونه جدول کشورهای برتر ===${COLOR.RESET}`);
      console.log(`${COLOR.DIM}کد کشور | تعداد | قیمت | قیمت خرده‌فروشی${COLOR.RESET}`);
      console.log(`${COLOR.DIM}${'-'.repeat(50)}${COLOR.RESET}`);
      
      const sampleEntries = Object.entries(allTopCountries).slice(0, 10);
      sampleEntries.forEach(([key, data]) => {
        console.log(`${COLOR.YELLOW}${data.country.toString().padStart(8, ' ')} | ${data.count.toString().padStart(6, ' ')} | ${data.price.toFixed(2).padStart(5, ' ')} | ${data.retail_price.toFixed(2).padStart(5, ' ')}${COLOR.RESET}`);
      });
    }
    
  } catch (error: unknown) {
    console.error(`${COLOR.RED}❌ خطا در اجرای تست:${COLOR.RESET}`);
    if (error instanceof Error) {
      console.error(`${COLOR.RED}پیام خطا: ${error.message}${COLOR.RESET}`);
      console.error(`${COLOR.DIM}استک خطا: ${error.stack}${COLOR.RESET}`);
    } else {
      console.error(`${COLOR.RED}${String(error)}${COLOR.RESET}`);
    }
  }
}

/**
 * تست دریافت کشورهای برتر با قیمت آزاد
 */
async function testGetTopCountriesWithFreePrice(): Promise<void> {
  console.log(`\n${COLOR.BOLD}${COLOR.BLUE}=== شروع تست دریافت کشورهای برتر با قیمت آزاد ===${COLOR.RESET}`);
  
  try {
    // پاک کردن کش قبلی برای اطمینان از دریافت داده‌های جدید
    productApi.clearCache();
    
    // کد سرویس (به عنوان مثال VK)
    const serviceCode = 'vk';
    
    // دریافت کشورهای برتر با قیمت آزاد
    console.log(`در حال دریافت کشورهای برتر با قیمت آزاد برای سرویس "${serviceCode}"...`);
    const startTime = Date.now();
    const topCountriesWithFreePrice = await productApi.getTopCountriesByService(serviceCode, true);
    const endTime = Date.now();
    
    // نمایش زمان اجرا
    console.log(`${COLOR.GREEN}✅ لیست کشورهای برتر با قیمت آزاد با موفقیت دریافت شد (${endTime - startTime} میلی‌ثانیه)${COLOR.RESET}`);
    
    // نمایش تعداد کشورهای برتر
    const countryCount = Object.keys(topCountriesWithFreePrice).length;
    console.log(`${COLOR.CYAN}📊 تعداد کشورهای برتر با قیمت آزاد: ${countryCount}${COLOR.RESET}`);
    
    if (countryCount === 0) {
      console.log(`${COLOR.YELLOW}⚠️ هیچ کشور برتری با قیمت آزاد یافت نشد.${COLOR.RESET}`);
    } else {
      // نمایش جدول کشورهای برتر با قیمت آزاد
      console.log(`\n${COLOR.BOLD}=== جدول کشورهای برتر با قیمت آزاد ===${COLOR.RESET}`);
      console.log(`${COLOR.DIM}کد کشور | تعداد | قیمت | قیمت خرده‌فروشی${COLOR.RESET}`);
      console.log(`${COLOR.DIM}${'-'.repeat(50)}${COLOR.RESET}`);
      
      Object.entries(topCountriesWithFreePrice).slice(0, 10).forEach(([key, data]) => {
        console.log(`${COLOR.YELLOW}${data.country.toString().padStart(8, ' ')} | ${data.count.toString().padStart(6, ' ')} | ${data.price.toFixed(2).padStart(5, ' ')} | ${data.retail_price.toFixed(2).padStart(5, ' ')}${COLOR.RESET}`);
      });
      
      // نمایش نقشه قیمت آزاد برای اولین کشور (در صورت وجود)
      const firstCountryWithFreePrice = Object.values(topCountriesWithFreePrice).find(country => country.freePriceMap);
      if (firstCountryWithFreePrice && firstCountryWithFreePrice.freePriceMap) {
        console.log(`\n${COLOR.BOLD}=== نمونه نقشه قیمت آزاد برای کشور ${firstCountryWithFreePrice.country} ===${COLOR.RESET}`);
        console.log(`${COLOR.DIM}قیمت | تعداد${COLOR.RESET}`);
        console.log(`${COLOR.DIM}${'-'.repeat(20)}${COLOR.RESET}`);
        
        Object.entries(firstCountryWithFreePrice.freePriceMap).forEach(([price, count]) => {
          console.log(`${COLOR.YELLOW}${price.padStart(5, ' ')} | ${count.toString().padStart(6, ' ')}${COLOR.RESET}`);
        });
      } else {
        console.log(`${COLOR.YELLOW}⚠️ هیچ نقشه قیمت آزاد در پاسخ یافت نشد. ممکن است API فرمت متفاوتی داشته باشد.${COLOR.RESET}`);
      }
    }
    
  } catch (error: unknown) {
    console.error(`${COLOR.RED}❌ خطا در اجرای تست:${COLOR.RESET}`);
    if (error instanceof Error) {
      console.error(`${COLOR.RED}پیام خطا: ${error.message}${COLOR.RESET}`);
      console.error(`${COLOR.DIM}استک خطا: ${error.stack}${COLOR.RESET}`);
    } else {
      console.error(`${COLOR.RED}${String(error)}${COLOR.RESET}`);
    }
  }
}

/**
 * پرداز اصلی برنامه
 */
async function main() {
  let running = true;
  
  while (running) {
    // نمایش منو
    showMenu();
    
    // دریافت انتخاب کاربر
    const choice = await getUserInput();
    
    // اجرای تست متناسب با انتخاب کاربر
    switch (choice) {
      case 1:
        await testGetCountries();
        break;
      case 2:
        await testGetServicesList();
        break;
      case 3:
        await testGetVKTopCountries();
        break;
      case 4:
        await testGetAllTopCountries();
        break;
      case 5:
        await testGetTopCountriesWithFreePrice();
        break;
      case 6:
        await testGetServicesForCountry();
        break;
      case 0:
        console.log(`${COLOR.GREEN}برنامه با موفقیت پایان یافت. خدانگهدار!${COLOR.RESET}`);
        running = false;
        break;
      default:
        console.log(`${COLOR.RED}⚠️ گزینه نامعتبر. لطفاً عدد بین 0 تا 6 را وارد کنید.${COLOR.RESET}`);
        break;
    }
    
    if (running && choice >= 0 && choice <= 6) {
      console.log(`\n${COLOR.CYAN}${COLOR.BOLD}برای ادامه کلید Enter را فشار دهید...${COLOR.RESET}`);
      await new Promise(resolve => {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        readline.question('', () => {
          readline.close();
          resolve(null);
        });
      });
    }
  }
}

// اجرای برنامه
main().catch(error => {
  console.error(`${COLOR.RED}❌ خطا در اجرای برنامه:${COLOR.RESET}`, error);
  process.exit(1);
});
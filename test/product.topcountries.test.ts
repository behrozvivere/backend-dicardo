/**
 * فایل تست برای متد getTopCountriesByService در product.api.ts
 * 
 * این فایل مستقیماً از ProductApi استفاده می‌کند تا لیست کشورهای برتر برای سرویس VK را دریافت کند
 * و نتایج را نمایش می‌دهد.
 */

import { productApi, TopCountryData } from '../src/modules/products/external';

/**
 * تابع اصلی برای تست کردن فراخوانی API
 */
async function testGetVKTopCountries() {
  console.log('=== شروع تست دریافت کشورهای برتر برای سرویس VK ===');
  
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
    console.log(`✅ لیست کشورهای برتر برای سرویس VK با موفقیت دریافت شد (${endTime - startTime} میلی‌ثانیه)`);
    
    // نمایش تعداد کشورهای برتر
    const countryCount = Object.keys(vkTopCountries).length;
    console.log(`📊 تعداد کشورهای برتر برای سرویس VK: ${countryCount}`);
    
    if (countryCount === 0) {
      console.log('⚠️ هیچ کشور برتری برای سرویس VK یافت نشد.');
    } else {
      // نمایش تمام کشورهای برتر برای سرویس VK
      console.log('\n=== کشورهای برتر برای سرویس VK ===');
      console.log(JSON.stringify(vkTopCountries, null, 2));
      
      // نمایش کشورها به صورت جدول
      console.log('\n=== جدول کشورهای برتر برای سرویس VK ===');
      console.log('کد کشور | تعداد | قیمت | قیمت خرده‌فروشی');
      console.log('-'.repeat(50));
      
      Object.entries(vkTopCountries).forEach(([key, data]) => {
        console.log(`${data.country.toString().padStart(8, ' ')} | ${data.count.toString().padStart(6, ' ')} | ${data.price.toFixed(2).padStart(5, ' ')} | ${data.retail_price.toFixed(2).padStart(5, ' ')}`);
      });
      
      // محاسبه برخی آمارها
      const totalCount = Object.values(vkTopCountries).reduce((sum, data) => sum + data.count, 0);
      const avgPrice = Object.values(vkTopCountries).reduce((sum, data) => sum + data.price, 0) / countryCount;
      
      console.log('\n=== آمار کلی ===');
      console.log(`🔢 مجموع تعداد: ${totalCount}`);
      console.log(`💰 میانگین قیمت: ${avgPrice.toFixed(2)}`);
    }
    
    // تست کش
    console.log('\n=== تست کش ===');
    console.log('در حال فراخوانی مجدد API با کش فعال...');
    const cacheStartTime = Date.now();
    await productApi.getTopCountriesByService(serviceCode);
    const cacheEndTime = Date.now();
    
    console.log(`✅ فراخوانی دوم انجام شد (${cacheEndTime - cacheStartTime} میلی‌ثانیه)`);
    if (endTime - startTime > 0) {
      console.log(`📈 بهبود سرعت با استفاده از کش: ${Math.round((endTime - startTime - (cacheEndTime - cacheStartTime)) / (endTime - startTime) * 100)}%`);
    }
    
    console.log('\n✅ تست با موفقیت انجام شد');
    
  } catch (error: unknown) {
    console.error('❌ خطا در اجرای تست:');
    if (error instanceof Error) {
      console.error(`پیام خطا: ${error.message}`);
      console.error(`استک خطا: ${error.stack}`);
    } else {
      console.error(String(error));
    }
    process.exit(1);
  }
}

// اجرای تست
testGetVKTopCountries()
  .then(() => console.log('✅ پایان موفقیت‌آمیز تست'))
  .catch((error: unknown) => {
    console.error('❌ خطای نهایی:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
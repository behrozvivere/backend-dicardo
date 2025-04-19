/**
 * فایل تست برای product.api.ts
 * 
 * این فایل مستقیماً از ProductApi استفاده می‌کند تا لیست کشورها را دریافت کند
 * و نتایج را نمایش می‌دهد.
 */

import { productApi, CountriesResponse } from '../src/modules/products/external';

/**
 * تابع اصلی برای تست کردن فراخوانی API
 */
async function testGetCountries() {
  console.log('=== شروع تست دریافت کشورها ===');
  console.log('در حال دریافت لیست کشورها...');
  
  try {
    // پاک کردن کش قبلی برای اطمینان از دریافت داده‌های جدید
    productApi.clearCache();
    
    // دریافت لیست کشورها
    const startTime = Date.now();
    const countries = await productApi.getCountries();
    const endTime = Date.now();
    
    // نمایش زمان اجرا
    console.log(`✅ لیست کشورها با موفقیت دریافت شد (${endTime - startTime} میلی‌ثانیه)`);
    
    // نمایش تعداد کشورها
    console.log(`📊 تعداد کل کشورهای دریافت شده: ${Object.keys(countries).length}`);
    
    // نمایش کامل اطلاعات دریافتی برای بررسی ساختار
    console.log('\n=== ساختار داده‌های دریافتی ===');
    console.log(JSON.stringify(countries, null, 2));
    
    // نمایش چند کشور به عنوان نمونه
    console.log('\n=== نمونه کشورها ===');
    const sampleCountries = Object.entries(countries).slice(0, 5);
    sampleCountries.forEach(([key, countryData]) => {
      console.log(`🌍 کلید: ${key}`);
      console.log(`   - مقادیر: ${JSON.stringify(countryData)}`);
    });
    
    // بررسی کش با اجرای مجدد
    console.log('\n=== تست کش ===');
    console.log('در حال فراخوانی مجدد API با کش فعال...');
    const cacheStartTime = Date.now();
    await productApi.getCountries();
    const cacheEndTime = Date.now();
    
    console.log(`✅ فراخوانی دوم انجام شد (${cacheEndTime - cacheStartTime} میلی‌ثانیه)`);
    console.log(`📈 بهبود سرعت با استفاده از کش: ${Math.round((endTime - startTime - (cacheEndTime - cacheStartTime)) / (endTime - startTime) * 100)}%`);
    
    console.log('\n✅ تست با موفقیت انجام شد');
    
  } catch (error) {
    console.error('❌ خطا در اجرای تست:');
    if (error instanceof Error) {
      console.error(`پیام خطا: ${error.message}`);
      console.error(`استک خطا: ${error.stack}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// اجرای تست
testGetCountries()
  .then(() => console.log('✅ پایان موفقیت‌آمیز تست'))
  .catch(error => {
    console.error('❌ خطای نهایی:', error);
    process.exit(1);
  });
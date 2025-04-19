/**
 * فایل تست برای متد getNumberV2 در product.api.ts
 * 
 * این فایل مستقیماً از ProductApi استفاده می‌کند تا شماره فعالسازی را دریافت کند
 * و نتایج را به صورت خام نمایش می‌دهد.
 */

import { productApi, GetNumberV2Params, GetNumberV2Response } from '../src/modules/products/external';

/**
 * تابع اصلی برای تست کردن فراخوانی API
 */
async function testGetNumberV2() {
  console.log('=== Testing getNumberV2 API Method ===');
  
  try {
    // ایجاد یک شناسه سفارش منحصر به فرد
    const orderId = `test_order_${Date.now()}`;
    
    // تنظیم پارامترهای درخواست برای اندونزی و سرویس "wa"
    const params: GetNumberV2Params = {
      service: 'wa',    // WhatsApp service
      country: 6,       // Indonesia country code
      orderId: orderId, // Unique order ID
    };
    
    // نمایش پارامترهای درخواست
    console.log('Request parameters:');
    console.log(JSON.stringify(params, null, 2));
    
    // ارسال درخواست
    console.log('\nRequesting activation number...');
    const startTime = Date.now();
    
    try {
      // دریافت پاسخ از API
      const response = await productApi.getNumberV2(params);
      const endTime = Date.now();
      
      // نمایش زمان اجرا
      console.log(`✅ Activation number successfully received (${endTime - startTime} ms)`);
      
      // نمایش اطلاعات خام پاسخ API
      console.log('\n=== Raw API Response ===');
      console.log(JSON.stringify(response, null, 2));
      
      // تست درخواست تکراری با همان شناسه سفارش
      console.log('\n=== Testing Duplicate Order ID ===');
      console.log('Attempting to request with the same orderId...');
      
      try {
        const duplicateResponse = await productApi.getNumberV2(params);
        console.log('❌ Error: Duplicate request should not succeed!');
        console.log('Duplicate response:');
        console.log(JSON.stringify(duplicateResponse, null, 2));
      } catch (duplicateError) {
        console.log('✅ Expected error for duplicate request received:');
        console.log(duplicateError);
      }
      
    } catch (activationError) {
      console.log('❌ Error requesting activation number:');
      console.log(activationError);
      
      // بررسی برخی خطاهای رایج
      if (activationError instanceof Error) {
        if (activationError.message.includes('NO_NUMBERS')) {
          console.log('\n⚠️ No numbers available for this service/country at the moment.');
        } else if (activationError.message.includes('NO_BALANCE')) {
          console.log('\n⚠️ Insufficient account balance.');
        } else if (activationError.message.includes('BAD_KEY')) {
          console.log('\n⚠️ Invalid API key.');
        }
      }
    }
    
    console.log('\n✅ Test completed');
    
  } catch (error: unknown) {
    console.error('❌ Test execution error:');
    console.error(error);
    process.exit(1);
  }
}

// اجرای تست
testGetNumberV2()
  .then(() => console.log('✅ Test execution completed'))
  .catch((error: unknown) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
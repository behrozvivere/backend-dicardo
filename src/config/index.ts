/**
 * فایل اصلی تنظیمات برنامه
 * این فایل همه تنظیمات مهم برنامه را از ماژول‌های مختلف صادر می‌کند
 * تا دسترسی به آنها از سایر بخش‌های برنامه آسان‌تر باشد
 */

// صادر کردن تنظیمات محیطی
import env, { 
  smsActivateConfig, 
  supabaseConfig, 
  serverConfig 
} from './env';

export {
  env as envConfig,
  smsActivateConfig,
  supabaseConfig,
  serverConfig,
};

// صادر کردن تنظیمات و سرویس‌های پایگاه داده
import supabaseService, { 
  supabase, 
  supabaseAdmin 
} from './db';

export {
  supabaseService,
  supabase,
  supabaseAdmin,
};

/**
 * تایپ آبجکت پیکربندی اصلی
 */
export type ConfigType = {
  env: {
    smsActivate: typeof smsActivateConfig;
    supabase: typeof supabaseConfig;
    server: typeof serverConfig;
  };
  db: {
    // فقط برای ارجاع به سرویس، خصوصیت‌های خصوصی را شامل نمی‌شود
    supabaseService: {
      testConnection: typeof supabaseService.testConnection;
    };
    supabase: typeof supabase;
    supabaseAdmin: typeof supabaseAdmin;
  };
};

/**
 * دسترسی آسان به همه تنظیمات برنامه
 */
export const config: ConfigType = {
  env: {
    smsActivate: smsActivateConfig,
    supabase: supabaseConfig,
    server: serverConfig,
  },
  db: {
    // فقط متدهای عمومی را در دسترس قرار می‌دهیم
    supabaseService: {
      testConnection: supabaseService.testConnection.bind(supabaseService)
    },
    supabase,
    supabaseAdmin,
  },
};

// صادر کردن کانفیگ به عنوان خروجی پیش‌فرض
export default config;
import * as dotenv from 'dotenv';
import * as path from 'path';

// بارگذاری فایل .env
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

/**
 * SMS-Activate تنظیمات مربوط به سرویس
 */
export const smsActivateConfig = {
  apiKey: process.env.API_KEY || '',
  apiUrl: process.env.api_url || 'https://api.sms-activate.ae/stubs/handler_api.php',
};

/**
 * Supabase تنظیمات مربوط به
 */
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

/**
 * تنظیمات مربوط به سرور
 */
export const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};

/**
 * تمام متغیرهای محیطی
 */
export const env = {
  smsActivate: smsActivateConfig,
  supabase: supabaseConfig,
  server: serverConfig,
};

export default env;
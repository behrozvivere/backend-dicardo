import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './env';

/**
 * کلاس مدیریت اتصال به Supabase
 * این کلاس با الگوی Singleton پیاده‌سازی شده تا یک اتصال واحد در کل برنامه استفاده شود
 */
class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient;
  private serviceClient: SupabaseClient;

  private constructor() {
    // ایجاد کلاینت با کلید ناشناس (برای دسترسی محدود)
    this.client = createClient(
      supabaseConfig.url,
      supabaseConfig.anonKey
    );

    // ایجاد کلاینت با کلید سرویس (برای دسترسی کامل)
    this.serviceClient = createClient(
      supabaseConfig.url,
      supabaseConfig.serviceRoleKey
    );
  }

  /**
   * دریافت نمونه واحد از کلاس
   * @returns نمونه SupabaseService
   */
  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * دریافت کلاینت Supabase با دسترسی محدود
   * برای استفاده در سمت کاربر و API‌های عمومی
   * @returns کلاینت Supabase با دسترسی محدود
   */
  public getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * دریافت کلاینت Supabase با دسترسی کامل
   * فقط برای استفاده در سرور و عملیات‌های مدیریتی
   * @returns کلاینت Supabase با دسترسی کامل
   */
  public getServiceClient(): SupabaseClient {
    return this.serviceClient;
  }

  /**
   * تست اتصال به Supabase
   * @returns {Promise<boolean>} وضعیت اتصال
   */
  public async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.serviceClient.auth.getSession();
      if (error) {
        console.error('خطا در اتصال به Supabase:', error.message);
        return false;
      }
      
      console.log('اتصال به Supabase با موفقیت انجام شد.');
      return true;
    } catch (err: any) {
      console.error('خطا در تست اتصال به Supabase:', err.message);
      return false;
    }
  }
}

// صادر کردن یک نمونه واحد از سرویس
const supabaseService = SupabaseService.getInstance();

// صادر کردن کلاینت‌ها برای دسترسی آسان
export const supabase = supabaseService.getClient();
export const supabaseAdmin = supabaseService.getServiceClient();

// صادر کردن سرویس برای دسترسی به متدهای بیشتر
export default supabaseService;
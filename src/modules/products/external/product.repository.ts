import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/config';
import { Logger } from '@/core/logger';
import { 
  Country, 
  Service, 
  ServicePrice, 
  Activation, 
  ActivationStatus 
} from '@/types';

// کلاس لاگر برای این ماژول
const logger = new Logger('ProductRepository');

/**
 * کلاس Repository برای محصولات
 * این کلاس مسئولیت ارتباط با دیتابیس برای محصولات و سرویس‌ها را به عهده دارد
 * با استفاده از الگوی Repository، لایه دیتابیس از لایه‌های بالاتر جدا می‌شود
 */
export class ProductRepository {
  private readonly supabase: SupabaseClient;

  /**
   * سازنده کلاس
   * @param supabaseClient کلاینت Supabase (در صورت عدم ارسال، از کلاینت پیش‌فرض استفاده می‌شود)
   */
  constructor(supabaseClient?: SupabaseClient) {
    // در صورت عدم ارسال کلاینت، از کلاینت ادمین پیش‌فرض استفاده می‌کنیم
    this.supabase = supabaseClient || supabaseAdmin;
  }

  /**
   * مدیریت خطاهای دیتابیس
   * @param error خطای دریافتی
   * @param operation نام عملیات
   * @param entity نام موجودیت
   */
  private handleError(error: any, operation: string, entity: string): never {
    const errorMessage = error?.message || 'Unknown database error';
    const errorCode = error?.code || 'UNKNOWN';
    const fullMessage = `Database error during ${operation} ${entity}: ${errorMessage} (Code: ${errorCode})`;
    
    logger.error(fullMessage, { error, operation, entity });
    
    throw new Error(fullMessage);
  }

  // ==================== روش‌های مربوط به کشورها ====================

  /**
   * دریافت تمام کشورها
   * @param options گزینه‌های فیلتر (اختیاری)
   * @returns لیست کشورها
   */
  async getCountries(options?: { 
    visible?: boolean, 
    withServices?: boolean 
  }): Promise<Country[]> {
    try {
      let query = this.supabase.from('countries').select('*');
      
      // اعمال فیلتر visible
      if (options?.visible !== undefined) {
        query = query.eq('visible', options.visible);
      }

      // دریافت داده‌ها
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const countries = data as unknown as Country[];

      // اگر نیاز به سرویس‌های هر کشور باشد
      if (options?.withServices) {
        // برای هر کشور، سرویس‌های مرتبط را دریافت می‌کنیم
        for (const country of countries) {
          const services = await this.getServicePricesByCountry(country.id);
          country.services = services;
        }
      }

      return countries;
    } catch (error: any) {
      return this.handleError(error, 'get', 'countries');
    }
  }

  /**
   * دریافت یک کشور با شناسه
   * @param id شناسه کشور
   * @returns اطلاعات کشور یا null
   */
  async getCountryById(id: number): Promise<Country | null> {
    try {
      const { data, error } = await this.supabase
        .from('countries')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as unknown as Country | null;
    } catch (error: any) {
      return this.handleError(error, 'getById', 'country');
    }
  }

  /**
   * ایجاد یا به‌روزرسانی چندین کشور
   * @param countries لیست کشورهایی که باید ایجاد یا به‌روزرسانی شوند
   * @returns تعداد رکوردهای تحت تأثیر قرار گرفته
   */
  async upsertCountries(countries: Omit<Country, 'created_at'>[]): Promise<number> {
    try {
      // اطمینان از اینکه created_at حذف شده
      const sanitizedData = countries.map(({ created_at, ...rest }) => rest);
      
      const { data, error, count } = await this.supabase
        .from('countries')
        .upsert(sanitizedData, { 
          onConflict: 'id',
          returning: 'minimal',
          count: 'exact'
        });

      if (error) {
        throw error;
      }

      logger.info(`Upserted ${count || sanitizedData.length} countries`);
      return count || sanitizedData.length;
    } catch (error: any) {
      return this.handleError(error, 'upsert', 'countries');
    }
  }

  /**
   * به‌روزرسانی وضعیت نمایش یک کشور
   * @param id شناسه کشور
   * @param visible وضعیت نمایش
   * @returns کشور به‌روزرسانی شده
   */
  async updateCountryVisibility(id: number, visible: boolean): Promise<Country> {
    try {
      const { data, error } = await this.supabase
        .from('countries')
        .update({ visible })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as unknown as Country;
    } catch (error: any) {
      return this.handleError(error, 'updateVisibility', 'country');
    }
  }

  // ==================== روش‌های مربوط به سرویس‌ها ====================

  /**
   * دریافت تمام سرویس‌ها
   * @returns لیست سرویس‌ها
   */
  async getServices(): Promise<Service[]> {
    try {
      const { data, error } = await this.supabase
        .from('services')
        .select('*');

      if (error) {
        throw error;
      }

      return data as unknown as Service[];
    } catch (error: any) {
      return this.handleError(error, 'get', 'services');
    }
  }

  /**
   * دریافت یک سرویس با کد
   * @param code کد سرویس
   * @returns اطلاعات سرویس یا null
   */
  async getServiceByCode(code: string): Promise<Service | null> {
    try {
      const { data, error } = await this.supabase
        .from('services')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as unknown as Service | null;
    } catch (error: any) {
      return this.handleError(error, 'getByCode', 'service');
    }
  }

  /**
   * ایجاد یا به‌روزرسانی چندین سرویس
   * @param services لیست سرویس‌هایی که باید ایجاد یا به‌روزرسانی شوند
   * @returns تعداد رکوردهای تحت تأثیر قرار گرفته
   */
  async upsertServices(services: Omit<Service, 'created_at'>[]): Promise<number> {
    try {
      // اطمینان از اینکه created_at حذف شده
      const sanitizedData = services.map(({ created_at, ...rest }) => rest);
      
      const { error, count } = await this.supabase
        .from('services')
        .upsert(sanitizedData, { 
          onConflict: 'code',
          returning: 'minimal',
          count: 'exact'
        });

      if (error) {
        throw error;
      }

      logger.info(`Upserted ${count || sanitizedData.length} services`);
      return count || sanitizedData.length;
    } catch (error: any) {
      return this.handleError(error, 'upsert', 'services');
    }
  }

  // ==================== روش‌های مربوط به قیمت سرویس‌ها ====================

  /**
   * دریافت تمام قیمت‌های سرویس با امکان فیلتر
   * @param filters فیلترهای اختیاری
   * @returns لیست قیمت‌های سرویس
   */
  async getServicePrices(filters?: { 
    countryId?: number;
    serviceCode?: string;
    minCount?: number;
    withCountry?: boolean;
    withService?: boolean;
  }): Promise<ServicePrice[]> {
    try {
      // ساخت کوئری پایه
      let selectClause = '*';
      if (filters?.withCountry) {
        selectClause += ', countries(id, name, image)';
      }
      if (filters?.withService) {
        selectClause += ', services(code, name, image)';
      }
      
      let query = this.supabase
        .from('service_prices')
        .select(selectClause);

      // اعمال فیلترها
      if (filters?.countryId !== undefined) {
        query = query.eq('country_id', filters.countryId);
      }
      if (filters?.serviceCode) {
        query = query.eq('service_code', filters.serviceCode);
      }
      if (filters?.minCount !== undefined) {
        query = query.gte('count', filters.minCount);
      }

      // دریافت داده‌ها
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // تبدیل و تمیزسازی داده‌ها
      const servicePrices = data?.map(item => {
        const result: any = { ...item };
        
        // تبدیل داده‌های nested به فرمت مناسب
        if (filters?.withCountry && item.countries) {
          result.country = item.countries;
          delete result.countries;
        }
        if (filters?.withService && item.services) {
          result.service = item.services;
          delete result.services;
        }
        
        return result;
      }) as unknown as ServicePrice[];

      return servicePrices || [];
    } catch (error: any) {
      return this.handleError(error, 'get', 'servicePrices');
    }
  }

  /**
   * دریافت قیمت‌های سرویس برای یک کشور خاص
   * @param countryId شناسه کشور
   * @returns لیست قیمت‌های سرویس برای کشور مشخص شده
   */
  async getServicePricesByCountry(countryId: number): Promise<ServicePrice[]> {
    return this.getServicePrices({ 
      countryId, 
      withService: true 
    });
  }

  /**
   * دریافت قیمت‌های سرویس برای یک سرویس خاص
   * @param serviceCode کد سرویس
   * @returns لیست قیمت‌های سرویس برای سرویس مشخص شده
   */
  async getServicePricesByService(serviceCode: string): Promise<ServicePrice[]> {
    return this.getServicePrices({ 
      serviceCode, 
      withCountry: true 
    });
  }

  /**
   * دریافت قیمت سرویس برای ترکیب سرویس و کشور
   * @param serviceCode کد سرویس
   * @param countryId شناسه کشور
   * @returns قیمت سرویس یا null
   */
  async getServicePrice(serviceCode: string, countryId: number): Promise<ServicePrice | null> {
    try {
      const { data, error } = await this.supabase
        .from('service_prices')
        .select(`
          *,
          countries(id, name, image),
          services(code, name, image)
        `)
        .eq('service_code', serviceCode)
        .eq('country_id', countryId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      // تبدیل داده‌های nested به فرمت مناسب
      const result: any = { ...data };
      
      if (data.countries) {
        result.country = data.countries;
        delete result.countries;
      }
      
      if (data.services) {
        result.service = data.services;
        delete result.services;
      }

      return result as ServicePrice;
    } catch (error: any) {
      return this.handleError(error, 'getServicePrice', 'servicePrice');
    }
  }

  /**
   * ایجاد یا به‌روزرسانی چندین قیمت سرویس
   * @param servicePrices لیست قیمت‌های سرویس که باید ایجاد یا به‌روزرسانی شوند
   * @returns تعداد رکوردهای تحت تأثیر قرار گرفته
   */
  async upsertServicePrices(servicePrices: Omit<ServicePrice, 'id' | 'created_at' | 'last_updated'>[]): Promise<number> {
    try {
      // اطمینان از اینکه فیلدهای اضافه حذف شده‌اند
      const sanitizedData = servicePrices.map(({ 
        id, created_at, last_updated, country, service, ...rest 
      }) => ({
        ...rest,
        last_updated: new Date().toISOString() // به‌روزرسانی تاریخ آخرین تغییر
      }));
      
      const { error, count } = await this.supabase
        .from('service_prices')
        .upsert(sanitizedData, { 
          onConflict: 'service_code,country_id',
          returning: 'minimal',
          count: 'exact'
        });

      if (error) {
        throw error;
      }

      logger.info(`Upserted ${count || sanitizedData.length} service prices`);
      return count || sanitizedData.length;
    } catch (error: any) {
      return this.handleError(error, 'upsert', 'servicePrices');
    }
  }

  /**
   * به‌روزرسانی قیمت تومانی برای یک سرویس/کشور
   * @param serviceCode کد سرویس
   * @param countryId شناسه کشور
   * @param priceIrt قیمت به تومان
   * @returns آیا به‌روزرسانی موفق بود
   */
  async updateServicePriceIrt(serviceCode: string, countryId: number, priceIrt: number): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('service_prices')
        .update({ 
          price_irt: priceIrt,
          last_updated: new Date().toISOString()
        })
        .eq('service_code', serviceCode)
        .eq('country_id', countryId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      logger.error(`Error updating price_irt for ${serviceCode}-${countryId}:`, error);
      return false;
    }
  }

  /**
   * به‌روزرسانی تعداد موجودی برای یک سرویس/کشور
   * @param serviceCode کد سرویس
   * @param countryId شناسه کشور
   * @param count تعداد جدید
   * @returns آیا به‌روزرسانی موفق بود
   */
  async updateServiceCount(serviceCode: string, countryId: number, count: number): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('service_prices')
        .update({ 
          count,
          last_updated: new Date().toISOString()
        })
        .eq('service_code', serviceCode)
        .eq('country_id', countryId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      logger.error(`Error updating count for ${serviceCode}-${countryId}:`, error);
      return false;
    }
  }

  // ==================== روش‌های مربوط به فعال‌سازی ====================

  /**
   * ایجاد یک رکورد فعال‌سازی جدید
   * @param activationData داده‌های فعال‌سازی
   * @returns اطلاعات فعال‌سازی ایجاد شده
   */
  async createActivation(activationData: Omit<Activation, 'id' | 'created_at' | 'updated_at' | 'activation_end_time' | 'sms'>): Promise<Activation> {
    try {
      const { data, error } = await this.supabase
        .from('activations')
        .insert({
          ...activationData,
          status: activationData.status || 'STATUS_WAIT_CODE' // وضعیت پیش‌فرض
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No data returned after activation creation');
      }

      return data as unknown as Activation;
    } catch (error: any) {
      return this.handleError(error, 'create', 'activation');
    }
  }

  /**
   * به‌روزرسانی وضعیت یک فعال‌سازی
   * @param activationId شناسه فعال‌سازی از API خارجی
   * @param status وضعیت جدید
   * @param sms کد SMS (اختیاری)
   * @param operator اپراتور (اختیاری)
   * @returns اطلاعات فعال‌سازی به‌روزرسانی شده یا null
   */
  async updateActivationStatus(
    activationId: number,
    status: ActivationStatus,
    options?: { 
      sms?: string | null,
      operator?: string | null
    }
  ): Promise<Activation | null> {
    try {
      const updateData: any = { status };
      
      // اضافه کردن فیلدهای اختیاری اگر ارسال شده باشند
      if (options?.sms !== undefined) {
        updateData.sms = options.sms;
      }
      
      if (options?.operator !== undefined) {
        updateData.operator = options.operator;
      }
      
      // اگر وضعیت به پایان رسیده یا لغو شده، زمان پایان را تنظیم می‌کنیم
      if (status === 'STATUS_OK' || status === 'STATUS_CANCEL') {
        updateData.activation_end_time = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('activations')
        .update(updateData)
        .eq('activation_id', activationId)
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as unknown as Activation | null;
    } catch (error: any) {
      // اگر خطا از نوع PGRST116 (No rows found) است، null برمی‌گردانیم
      if (error.code === 'PGRST116') {
        logger.warn(`Activation with ID ${activationId} not found for update.`);
        return null;
      }
      
      return this.handleError(error, 'updateStatus', 'activation');
    }
  }

  /**
   * دریافت فعال‌سازی با شناسه API خارجی
   * @param activationId شناسه فعال‌سازی
   * @returns اطلاعات فعال‌سازی یا null
   */
  async getActivationByActivationId(activationId: number): Promise<Activation | null> {
    try {
      const { data, error } = await this.supabase
        .from('activations')
        .select('*')
        .eq('activation_id', activationId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as unknown as Activation | null;
    } catch (error: any) {
      return this.handleError(error, 'getByActivationId', 'activation');
    }
  }

  /**
   * دریافت فعال‌سازی‌های در حال انتظار
   * @param options گزینه‌های فیلتر
   * @returns لیست فعال‌سازی‌های در حال انتظار
   */
  async getPendingActivations(options?: {
    serviceCode?: string;
    countryId?: number;
    maxResults?: number;
  }): Promise<Activation[]> {
    try {
      let query = this.supabase
        .from('activations')
        .select('*')
        .in('status', ['STATUS_WAIT_CODE', 'STATUS_WAIT_RETRY']);

      // اعمال فیلترها
      if (options?.serviceCode) {
        query = query.eq('service_code', options.serviceCode);
      }
      
      if (options?.countryId !== undefined) {
        query = query.eq('country_id', options.countryId);
      }
      
      // محدود کردن نتایج
      if (options?.maxResults) {
        query = query.limit(options.maxResults);
      }

      // مرتب‌سازی بر اساس زمان فعال‌سازی (قدیمی‌ترین ابتدا)
      query = query.order('activation_time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as unknown as Activation[];
    } catch (error: any) {
      return this.handleError(error, 'getPending', 'activations');
    }
  }

  /**
   * دریافت آمار و ارقام فعال‌سازی‌ها
   * @returns آمار فعال‌سازی‌ها
   */
  async getActivationsStats(): Promise<{
    total: number;
    waiting: number;
    completed: number;
    cancelled: number;
  }> {
    try {
      // کوئری برای شمارش کل
      const { count: total, error: totalError } = await this.supabase
        .from('activations')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // کوئری برای شمارش در انتظار
      const { count: waiting, error: waitingError } = await this.supabase
        .from('activations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['STATUS_WAIT_CODE', 'STATUS_WAIT_RETRY']);

      if (waitingError) throw waitingError;

      // کوئری برای شمارش تکمیل شده
      const { count: completed, error: completedError } = await this.supabase
        .from('activations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'STATUS_OK');

      if (completedError) throw completedError;

      // کوئری برای شمارش لغو شده
      const { count: cancelled, error: cancelledError } = await this.supabase
        .from('activations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'STATUS_CANCEL');

      if (cancelledError) throw cancelledError;

      return {
        total: total || 0,
        waiting: waiting || 0,
        completed: completed || 0,
        cancelled: cancelled || 0
      };
    } catch (error: any) {
      return this.handleError(error, 'getStats', 'activations');
    }
  }
}

// صادر کردن یک نمونه پیش‌فرض برای دسترسی آسان
export const productRepository = new ProductRepository();

export default productRepository;
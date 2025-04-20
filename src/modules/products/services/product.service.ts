/**
 * product.service.ts
 * 
 * این فایل مسئول مدیریت عملیات مربوط به محصولات و ارتباط با API خارجی است.
 */

import { 
  // مدل‌های دیتابیس
  Country, 
  Service,
  CountryService,
  Activation,
  CreateActivationParams
} from '../../../types';

import productApi from '../external/product.api';
import ProductMapper from '../external/product.mapper';

/**
 * سرویس مدیریت محصولات
 * این سرویس عملیات مربوط به دریافت و ذخیره‌سازی اطلاعات محصولات را انجام می‌دهد
 */
export class ProductService {
  /**
   * دریافت لیست تمام کشورها
   * @returns لیست کشورها
   */
  async getAllCountries(): Promise<Country[]> {
    const rawCountriesData = await productApi.getCountries();
    return ProductMapper.mapCountriesList(rawCountriesData);
  }

  /**
   * دریافت لیست تمام سرویس‌ها
   * @param countryId شناسه کشور (اختیاری)
   * @returns لیست سرویس‌ها
   */
  async getAllServices(countryId?: number): Promise<Service[]> {
    const rawServicesData = await productApi.getServicesList(countryId);
    return ProductMapper.mapServicesList(rawServicesData);
  }

  /**
   * دریافت لیست ارتباط کشورها و سرویس‌ها
   * @param serviceCode کد سرویس (اختیاری)
   * @returns لیست ارتباط کشورها و سرویس‌ها
   */
  async getCountryServiceList(serviceCode?: string): Promise<CountryService[]> {
    const rawTopCountriesData = await productApi.getTopCountriesByService(serviceCode);
    return ProductMapper.mapCountryServiceList(rawTopCountriesData);
  }

  /**
   * ایجاد یک فعال‌سازی جدید
   * @param params پارامترهای فعال‌سازی
   * @returns اطلاعات فعال‌سازی ایجاد شده
   */
  async createActivation(params: CreateActivationParams): Promise<Activation> {
    const rawActivationResponse = await productApi.getNumberV2({
      service: params.serviceCode,
      country: params.countryId,
      operator: params.operator
    });
    
    return ProductMapper.mapActivation(rawActivationResponse, params);
  }

  /**
   * دریافت وضعیت فعال‌سازی
   * @param activationId شناسه فعال‌سازی
   * @param currentActivation اطلاعات فعلی فعال‌سازی
   * @returns اطلاعات به‌روزشده فعال‌سازی
   */
  async getActivationStatus(activationId: number, currentActivation: Activation): Promise<Activation> {
    const rawStatusResponse = await productApi.getActivationStatus(activationId);
    return ProductMapper.updateActivationStatus(currentActivation, rawStatusResponse);
  }
}

// صادر کردن یک نمونه پیش‌فرض برای استفاده سریع
const productService = new ProductService();
export default productService;
/**
 * product.mapper.ts
 * 
 * این فایل مسئول تبدیل داده‌های خام دریافتی از API به مدل‌های قابل استفاده در دیتابیس است.
 * همچنین، مسیر تصاویر سرویس‌ها و کشورها را به داده‌ها اضافه می‌کند.
 */

import { 
  // تایپ‌های خام
  RawCountryData,
  RawCountriesResponse,
  RawService,
  RawServicesResponse,
  RawTopCountryData,
  RawTopCountriesResponse,
  RawGetNumberV2Response,
  RawGetActivationStatusResponse,
  RawActivationStatus,
  
  // مدل‌های دیتابیس
  Country,
  CountryList,
  Service,
  ServiceList,
  CountryService,
  CountryServiceList,
  Activation,
  ActivationStatus,
  CreateActivationParams,
  UpdateActivationStatusParams
} from '../../../types';

/**
 * کلاس اصلی mapper برای تبدیل داده‌های خام API به مدل‌های دیتابیس
 */
export class ProductMapper {
  
  /**
   * مسیر پایه برای تصاویر کشورها
   */
  private static readonly COUNTRIES_BASE_PATH = '/public/countries/';
  
  /**
   * مسیر پایه برای تصاویر سرویس‌ها
   */
  private static readonly SERVICES_BASE_PATH = '/public/brand/';

  /**
   * تبدیل داده خام کشور به مدل کشور
   * @param rawCountryData داده خام کشور دریافتی از API
   * @param countryKey کلید کشور (شناسه کشور به صورت رشته)
   * @returns مدل کشور قابل استفاده در دیتابیس
   */
  public static mapCountry(rawCountryData: RawCountryData, countryKey: string): Country {
    // تبدیل نام کشور به فرمت مناسب برای نام فایل تصویر
    const imageName = this.formatNameForImage(rawCountryData.eng);
    
    return {
      id: rawCountryData.id,
      name: rawCountryData.eng,
      visible: rawCountryData.visible,
      retry: rawCountryData.retry,
      rent: rawCountryData.rent,
      multiService: rawCountryData.multiService,
      image: `${this.COUNTRIES_BASE_PATH}${imageName}.webp`
    };
  }

  /**
   * تبدیل پاسخ خام کشورها به لیست مدل کشورها
   * @param rawCountriesResponse پاسخ خام کشورها دریافتی از API
   * @returns لیست مدل کشورها قابل استفاده در دیتابیس
   */
  public static mapCountriesList(rawCountriesResponse: RawCountriesResponse): CountryList {
    return Object.entries(rawCountriesResponse).map(([key, countryData]) => {
      return this.mapCountry(countryData, key);
    });
  }

  /**
   * تبدیل داده خام سرویس به مدل سرویس
   * @param rawService داده خام سرویس دریافتی از API
   * @returns مدل سرویس قابل استفاده در دیتابیس
   */
  public static mapService(rawService: RawService): Service {
    // کد سرویس برای نام فایل تصویر استفاده می‌شود
    return {
      code: rawService.code,
      name: rawService.name,
      image: `${this.SERVICES_BASE_PATH}${rawService.code}0.webp`
    };
  }

  /**
   * تبدیل پاسخ خام سرویس‌ها به لیست مدل سرویس‌ها
   * @param rawServicesResponse پاسخ خام سرویس‌ها دریافتی از API
   * @returns لیست مدل سرویس‌ها قابل استفاده در دیتابیس
   */
  public static mapServicesList(rawServicesResponse: RawServicesResponse): ServiceList {
    if (rawServicesResponse.status !== 'success' || !rawServicesResponse.services) {
      return [];
    }
    
    return rawServicesResponse.services.map(rawService => this.mapService(rawService));
  }

  /**
   * تبدیل داده خام کشور برتر به مدل ارتباط کشور و سرویس
   * @param rawTopCountryData داده خام کشور برتر دریافتی از API
   * @param serviceCode کد سرویس
   * @returns مدل ارتباط کشور و سرویس قابل استفاده در دیتابیس
   */
  public static mapCountryService(rawTopCountryData: RawTopCountryData, serviceCode: string): CountryService {
    return {
      serviceCode,
      countryId: rawTopCountryData.country,
      count: rawTopCountryData.count,
      price: rawTopCountryData.price,
      retailPrice: rawTopCountryData.retail_price
    };
  }

  /**
   * تبدیل پاسخ خام کشورهای برتر به لیست مدل ارتباط کشور و سرویس
   * @param rawTopCountriesResponse پاسخ خام کشورهای برتر دریافتی از API
   * @returns لیست مدل ارتباط کشور و سرویس قابل استفاده در دیتابیس
   */
  public static mapCountryServiceList(rawTopCountriesResponse: RawTopCountriesResponse): CountryServiceList {
    const result: CountryServiceList = [];
    
    Object.entries(rawTopCountriesResponse).forEach(([serviceCode, topCountryData]) => {
      result.push(this.mapCountryService(topCountryData, serviceCode));
    });
    
    return result;
  }

  /**
   * تبدیل پاسخ خام فعال‌سازی شماره به مدل فعال‌سازی
   * @param rawActivationResponse پاسخ خام فعال‌سازی شماره دریافتی از API
   * @param params پارامترهای درخواست فعال‌سازی
   * @returns مدل فعال‌سازی قابل استفاده در دیتابیس
   */
  public static mapActivation(
    rawActivationResponse: RawGetNumberV2Response, 
    params: CreateActivationParams
  ): Activation {
    return {
      serviceCode: params.serviceCode,
      countryId: params.countryId,
      operator: rawActivationResponse.activationOperator,
      phoneNumber: rawActivationResponse.phoneNumber,
      activationId: rawActivationResponse.activationId,
      activationCost: rawActivationResponse.activationCost,
      activationTime: rawActivationResponse.activationTime,
      canGetAnotherSms: rawActivationResponse.canGetAnotherSms === '1',
      status: ActivationStatus.WAITING_CODE,
      orderId: params.orderId
    };
  }

  /**
   * به‌روزرسانی مدل فعال‌سازی با وضعیت جدید
   * @param activation مدل فعال‌سازی فعلی
   * @param rawStatusResponse پاسخ خام وضعیت فعال‌سازی دریافتی از API
   * @returns مدل فعال‌سازی به‌روزشده
   */
  public static updateActivationStatus(
    activation: Activation, 
    rawStatusResponse: RawGetActivationStatusResponse
  ): Activation {
    const updatedActivation = { 
      ...activation, 
      status: rawStatusResponse.status as unknown as ActivationStatus 
    };
    
    // اگر کد SMS دریافت شده باشد، آن را به مدل اضافه می‌کنیم
    if (rawStatusResponse.code) {
      updatedActivation.sms = rawStatusResponse.code;
      
      // در صورت دریافت کد، زمان پایان فعال‌سازی را ثبت می‌کنیم
      if (rawStatusResponse.status === RawActivationStatus.OK) {
        updatedActivation.activationEndTime = new Date().toISOString();
      }
    }
    
    return updatedActivation;
  }

  /**
   * تبدیل نام به فرمت مناسب برای استفاده در نام فایل تصویر
   * مثال: "Sri Lanka" به "Sri-Lanka" تبدیل می‌شود
   * @param name نام اصلی
   * @returns فرمت مناسب برای نام فایل
   */
  private static formatNameForImage(name: string): string {
    // تبدیل کلمات به حالت Title Case (هر کلمه با حرف بزرگ شروع شود)
    const titleCase = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-');
    
    return titleCase;
  }
}

// صادر کردن یک نمونه پیش‌فرض برای استفاده سریع
export default ProductMapper;
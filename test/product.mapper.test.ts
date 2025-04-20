/**
 * product.mapper.test.ts
 * 
 * این فایل برای تست کردن عملکرد mapper و تبدیل داده‌های خام به مدل‌های دیتابیسی است.
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import ProductMapper from '../src/modules/products/external/product.mapper';
import {
  RawCountriesResponse,
  RawServicesResponse,
  RawTopCountriesResponse,
  RawGetNumberV2Response,
  RawGetActivationStatusResponse,
  RawActivationStatus,
  Country,
  Service,
  CountryService,
  CreateActivationParams,
  ActivationStatus
} from '../src/types';

describe('ProductMapper Tests', () => {
  describe('Country Mapping Tests', () => {
    it('should correctly map a raw country to database model', () => {
      // داده نمونه کشور خام
      const rawCountryData = {
        id: 1,
        rus: 'Россия',
        eng: 'Russia',
        chn: '俄罗斯',
        visible: 1,
        retry: 1,
        rent: 0,
        multiService: 1
      };
      
      // فراخوانی متد مپر
      const mappedCountry = ProductMapper.mapCountry(rawCountryData, '1');
      
      // بررسی نتایج تبدیل
      expect(mappedCountry).to.be.an('object');
      expect(mappedCountry.id).to.equal(1);
      expect(mappedCountry.name).to.equal('Russia');
      expect(mappedCountry.visible).to.equal(1);
      expect(mappedCountry.image).to.equal('/public/countries/russia.webp');
    });

    it('should correctly map a raw countries response to country list', () => {
      // داده نمونه پاسخ کشورهای خام
      const rawCountriesResponse: RawCountriesResponse = {
        '1': {
          id: 1,
          rus: 'Россия',
          eng: 'Russia',
          chn: '俄罗斯',
          visible: 1,
          retry: 1,
          rent: 0,
          multiService: 1
        },
        '2': {
          id: 2,
          rus: 'Украина',
          eng: 'Ukraine',
          chn: '乌克兰',
          visible: 1,
          retry: 1,
          rent: 0,
          multiService: 1
        },
        '3': {
          id: 3,
          rus: 'Казахстан',
          eng: 'Kazakhstan',
          chn: '哈萨克斯坦',
          visible: 1,
          retry: 1,
          rent: 0,
          multiService: 1
        }
      };
      
      // فراخوانی متد مپر
      const mappedCountries = ProductMapper.mapCountriesList(rawCountriesResponse);
      
      // بررسی نتایج تبدیل
      expect(mappedCountries).to.be.an('array');
      expect(mappedCountries).to.have.lengthOf(3);
      expect(mappedCountries[0].id).to.equal(1);
      expect(mappedCountries[0].name).to.equal('Russia');
      expect(mappedCountries[1].id).to.equal(2);
      expect(mappedCountries[1].name).to.equal('Ukraine');
      expect(mappedCountries[2].id).to.equal(3);
      expect(mappedCountries[2].name).to.equal('Kazakhstan');
      
      // بررسی تصاویر
      expect(mappedCountries[0].image).to.equal('/public/countries/russia.webp');
      expect(mappedCountries[1].image).to.equal('/public/countries/ukraine.webp');
      expect(mappedCountries[2].image).to.equal('/public/countries/kazakhstan.webp');
    });
    
    it('should correctly handle country names with spaces for image paths', () => {
      // داده نمونه کشور خام با نام دارای فاصله
      const rawCountryData = {
        id: 99,
        rus: 'Шри-Ланка',
        eng: 'Sri Lanka',
        chn: '斯里兰卡',
        visible: 1,
        retry: 1,
        rent: 0,
        multiService: 1
      };
      
      // فراخوانی متد مپر
      const mappedCountry = ProductMapper.mapCountry(rawCountryData, '99');
      
      // بررسی نتایج تبدیل مسیر تصویر
      expect(mappedCountry.image).to.equal('/public/countries/sri-lanka.webp');
    });
  });

  describe('Service Mapping Tests', () => {
    it('should correctly map a raw service to database model', () => {
      // داده نمونه سرویس خام
      const rawService = {
        code: 'tg',
        name: 'Telegram'
      };
      
      // فراخوانی متد مپر
      const mappedService = ProductMapper.mapService(rawService);
      
      // بررسی نتایج تبدیل
      expect(mappedService).to.be.an('object');
      expect(mappedService.code).to.equal('tg');
      expect(mappedService.name).to.equal('Telegram');
      expect(mappedService.image).to.equal('/public/brand/tg0.webp');
    });

    it('should correctly map a raw services response to service list', () => {
      // داده نمونه پاسخ سرویس‌های خام
      const rawServicesResponse: RawServicesResponse = {
        status: 'success',
        services: [
          { code: 'tg', name: 'Telegram' },
          { code: 'wa', name: 'WhatsApp' },
          { code: 'ig', name: 'Instagram' }
        ]
      };
      
      // فراخوانی متد مپر
      const mappedServices = ProductMapper.mapServicesList(rawServicesResponse);
      
      // بررسی نتایج تبدیل
      expect(mappedServices).to.be.an('array');
      expect(mappedServices).to.have.lengthOf(3);
      expect(mappedServices[0].code).to.equal('tg');
      expect(mappedServices[0].name).to.equal('Telegram');
      expect(mappedServices[1].code).to.equal('wa');
      expect(mappedServices[1].name).to.equal('WhatsApp');
      expect(mappedServices[2].code).to.equal('ig');
      expect(mappedServices[2].name).to.equal('Instagram');
      
      // بررسی تصاویر
      expect(mappedServices[0].image).to.equal('/public/brand/tg0.webp');
      expect(mappedServices[1].image).to.equal('/public/brand/wa0.webp');
      expect(mappedServices[2].image).to.equal('/public/brand/ig0.webp');
    });
    
    it('should return empty array when services status is not success', () => {
      // داده نمونه پاسخ سرویس‌های خام با وضعیت ناموفق
      const rawServicesResponse: RawServicesResponse = {
        status: 'error',
        services: []
      };
      
      // فراخوانی متد مپر
      const mappedServices = ProductMapper.mapServicesList(rawServicesResponse);
      
      // بررسی نتایج تبدیل
      expect(mappedServices).to.be.an('array');
      expect(mappedServices).to.have.lengthOf(0);
    });
  });

  describe('CountryService Mapping Tests', () => {
    it('should correctly map a raw top country data to country service model', () => {
      // داده نمونه کشور برتر خام
      const rawTopCountryData = {
        country: 1,
        count: 1000,
        price: 15.5,
        retail_price: 20
      };
      
      const serviceCode = 'tg';
      
      // فراخوانی متد مپر
      const mappedCountryService = ProductMapper.mapCountryService(rawTopCountryData, serviceCode);
      
      // بررسی نتایج تبدیل
      expect(mappedCountryService).to.be.an('object');
      expect(mappedCountryService.serviceCode).to.equal('tg');
      expect(mappedCountryService.countryId).to.equal(1);
      expect(mappedCountryService.count).to.equal(1000);
      expect(mappedCountryService.price).to.equal(15.5);
      expect(mappedCountryService.retailPrice).to.equal(20);
    });

    it('should correctly map a raw top countries response to country service list', () => {
      // داده نمونه پاسخ کشورهای برتر خام
      const rawTopCountriesResponse: RawTopCountriesResponse = {
        'tg': {
          country: 1,
          count: 1000,
          price: 15,
          retail_price: 20
        },
        'wa': {
          country: 2,
          count: 500,
          price: 25,
          retail_price: 30
        },
        'ig': {
          country: 3,
          count: 300,
          price: 35,
          retail_price: 40
        }
      };
      
      // فراخوانی متد مپر
      const mappedCountryServices = ProductMapper.mapCountryServiceList(rawTopCountriesResponse);
      
      // بررسی نتایج تبدیل
      expect(mappedCountryServices).to.be.an('array');
      expect(mappedCountryServices).to.have.lengthOf(3);
      
      // بررسی اطلاعات اولین آیتم
      expect(mappedCountryServices[0].serviceCode).to.equal('tg');
      expect(mappedCountryServices[0].countryId).to.equal(1);
      expect(mappedCountryServices[0].count).to.equal(1000);
      expect(mappedCountryServices[0].price).to.equal(15);
      expect(mappedCountryServices[0].retailPrice).to.equal(20);
      
      // بررسی اطلاعات دومین آیتم
      expect(mappedCountryServices[1].serviceCode).to.equal('wa');
      expect(mappedCountryServices[1].countryId).to.equal(2);
      expect(mappedCountryServices[1].count).to.equal(500);
      expect(mappedCountryServices[1].price).to.equal(25);
      expect(mappedCountryServices[1].retailPrice).to.equal(30);
      
      // بررسی اطلاعات سومین آیتم
      expect(mappedCountryServices[2].serviceCode).to.equal('ig');
      expect(mappedCountryServices[2].countryId).to.equal(3);
      expect(mappedCountryServices[2].count).to.equal(300);
      expect(mappedCountryServices[2].price).to.equal(35);
      expect(mappedCountryServices[2].retailPrice).to.equal(40);
    });
  });

  describe('Activation Mapping Tests', () => {
    it('should correctly map a raw activation response to activation model', () => {
      // داده نمونه پاسخ فعال‌سازی خام
      const rawActivationResponse: RawGetNumberV2Response = {
        activationId: 12345,
        phoneNumber: '+79123456789',
        activationCost: 15,
        currency: 643,
        countryCode: 'RU',
        canGetAnotherSms: '1',
        activationTime: '2025-04-20 10:00:00',
        activationOperator: 'mts'
      };
      
      // پارامترهای درخواست فعال‌سازی
      const activationParams: CreateActivationParams = {
        serviceCode: 'tg',
        countryId: 1,
        operator: 'mts',
        orderId: 'order-123'
      };
      
      // فراخوانی متد مپر
      const mappedActivation = ProductMapper.mapActivation(rawActivationResponse, activationParams);
      
      // بررسی نتایج تبدیل
      expect(mappedActivation).to.be.an('object');
      expect(mappedActivation.serviceCode).to.equal('tg');
      expect(mappedActivation.countryId).to.equal(1);
      expect(mappedActivation.operator).to.equal('mts');
      expect(mappedActivation.phoneNumber).to.equal('+79123456789');
      expect(mappedActivation.activationId).to.equal(12345);
      expect(mappedActivation.activationCost).to.equal(15);
      expect(mappedActivation.activationTime).to.equal('2025-04-20 10:00:00');
      expect(mappedActivation.canGetAnotherSms).to.equal(true);
      expect(mappedActivation.status).to.equal(ActivationStatus.WAITING_CODE);
      expect(mappedActivation.orderId).to.equal('order-123');
    });
    
    it('should correctly update activation status with SMS code', () => {
      // مدل فعال‌سازی موجود
      const existingActivation = {
        serviceCode: 'tg',
        countryId: 1,
        operator: 'mts',
        phoneNumber: '+79123456789',
        activationId: 12345,
        activationCost: 15,
        activationTime: '2025-04-20 10:00:00',
        canGetAnotherSms: true,
        status: ActivationStatus.WAITING_CODE,
        orderId: 'order-123'
      };
      
      // پاسخ خام وضعیت فعال‌سازی
      const rawStatusResponse: RawGetActivationStatusResponse = {
        status: RawActivationStatus.OK,
        code: '123456'
      };
      
      // فراخوانی متد مپر
      const updatedActivation = ProductMapper.updateActivationStatus(existingActivation, rawStatusResponse);
      
      // بررسی نتایج تبدیل
      expect(updatedActivation).to.be.an('object');
      expect(updatedActivation.status).to.equal(ActivationStatus.OK);
      expect(updatedActivation.sms).to.equal('123456');
      expect(updatedActivation.activationEndTime).to.be.a('string'); // زمان پایان باید تنظیم شده باشد
    });
    
    it('should handle activation status update without SMS code', () => {
      // مدل فعال‌سازی موجود
      const existingActivation = {
        serviceCode: 'tg',
        countryId: 1,
        operator: 'mts',
        phoneNumber: '+79123456789',
        activationId: 12345,
        activationCost: 15,
        activationTime: '2025-04-20 10:00:00',
        canGetAnotherSms: true,
        status: ActivationStatus.WAITING_CODE,
        orderId: 'order-123'
      };
      
      // پاسخ خام وضعیت فعال‌سازی
      const rawStatusResponse: RawGetActivationStatusResponse = {
        status: RawActivationStatus.WAITING_CODE
      };
      
      // فراخوانی متد مپر
      const updatedActivation = ProductMapper.updateActivationStatus(existingActivation, rawStatusResponse);
      
      // بررسی نتایج تبدیل
      expect(updatedActivation).to.be.an('object');
      expect(updatedActivation.status).to.equal(ActivationStatus.WAITING_CODE);
      expect(updatedActivation.sms).to.be.undefined; // هیچ کدی دریافت نشده است
      expect(updatedActivation.activationEndTime).to.be.undefined; // زمان پایان باید تنظیم نشده باشد
    });
  });
});
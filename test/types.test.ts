/**
 * فایل تست برای بررسی صحت تایپ‌های تعریف شده
 */

import { 
  // تایپ‌های خام
  RawCountryData,
  RawCountriesResponse,
  RawService,
  RawServicesResponse,
  RawTopCountryData,
  RawTopCountriesResponse,
  RawGetNumberV2Params,
  RawGetNumberV2Response,
  RawActivationStatus,
  RawActivationOperation,
  RawGetActivationStatusResponse,
  
  // مدل‌های دیتابیس
  Country,
  CountryList,
  Service,
  ServiceList,
  CountryService,
  CountryServiceList,
  Activation,
  ActivationList,
  ActivationStatus,
  CreateActivationParams,
  UpdateActivationStatusParams
} from '../src/types';

import assert from 'assert';

describe('Types Tests', () => {
  describe('Raw Types', () => {
    it('should create a valid RawCountryData object', () => {
      const countryData: RawCountryData = {
        id: 1,
        rus: 'Россия',
        eng: 'Russia',
        chn: '俄罗斯',
        visible: 1,
        retry: 1,
        rent: 0,
        multiService: 1
      };
      
      assert.strictEqual(countryData.id, 1);
      assert.strictEqual(countryData.eng, 'Russia');
    });
    
    it('should create a valid RawCountriesResponse object', () => {
      const countriesResponse: RawCountriesResponse = {
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
        }
      };
      
      assert.strictEqual(countriesResponse['1'].eng, 'Russia');
      assert.strictEqual(countriesResponse['2'].eng, 'Ukraine');
    });
    
    it('should create a valid RawService object', () => {
      const service: RawService = {
        code: 'tg',
        name: 'Telegram'
      };
      
      assert.strictEqual(service.code, 'tg');
      assert.strictEqual(service.name, 'Telegram');
    });
    
    it('should create a valid RawServicesResponse object', () => {
      const servicesResponse: RawServicesResponse = {
        status: 'success',
        services: [
          { code: 'tg', name: 'Telegram' },
          { code: 'wb', name: 'WhatsApp' }
        ]
      };
      
      assert.strictEqual(servicesResponse.status, 'success');
      assert.strictEqual(servicesResponse.services.length, 2);
      assert.strictEqual(servicesResponse.services[0].code, 'tg');
    });
    
    it('should create a valid RawTopCountryData object', () => {
      const topCountryData: RawTopCountryData = {
        country: 1,
        count: 1000,
        price: 15,
        retail_price: 20,
        freePriceMap: { '15': 500, '20': 500 }
      };
      
      assert.strictEqual(topCountryData.country, 1);
      assert.strictEqual(topCountryData.count, 1000);
      assert.strictEqual(topCountryData.freePriceMap?.['15'], 500);
    });
    
    it('should create a valid RawTopCountriesResponse object', () => {
      const topCountriesResponse: RawTopCountriesResponse = {
        'tg': {
          country: 1,
          count: 1000,
          price: 15,
          retail_price: 20
        },
        'wb': {
          country: 2,
          count: 500,
          price: 25,
          retail_price: 30
        }
      };
      
      assert.strictEqual(topCountriesResponse['tg'].country, 1);
      assert.strictEqual(topCountriesResponse['wb'].price, 25);
    });
    
    it('should create a valid RawGetNumberV2Params object', () => {
      const params: RawGetNumberV2Params = {
        service: 'tg',
        country: 1,
        operator: 'mts',
        forward: false
      };
      
      assert.strictEqual(params.service, 'tg');
      assert.strictEqual(params.country, 1);
    });
    
    it('should create a valid RawGetNumberV2Response object', () => {
      const response: RawGetNumberV2Response = {
        activationId: 12345,
        phoneNumber: '+79123456789',
        activationCost: 15,
        currency: 643,
        countryCode: 'RU',
        canGetAnotherSms: '1',
        activationTime: '2025-04-20 10:00:00',
        activationOperator: 'mts'
      };
      
      assert.strictEqual(response.activationId, 12345);
      assert.strictEqual(response.phoneNumber, '+79123456789');
    });
    
    it('should use correct RawActivationStatus values', () => {
      assert.strictEqual(RawActivationStatus.WAITING_CODE, 'STATUS_WAIT_CODE');
      assert.strictEqual(RawActivationStatus.OK, 'STATUS_OK');
    });
    
    it('should create a valid RawGetActivationStatusResponse object', () => {
      const statusResponse: RawGetActivationStatusResponse = {
        status: RawActivationStatus.OK,
        code: '12345'
      };
      
      assert.strictEqual(statusResponse.status, 'STATUS_OK');
      assert.strictEqual(statusResponse.code, '12345');
    });
  });
  
  describe('Database Models', () => {
    it('should create a valid Country object', () => {
      const country: Country = {
        id: 1,
        name: 'Russia',
        visible: 1,
        retry: 1,
        rent: 0,
        multiService: 1,
        image: 'countries/russia.png'
      };
      
      assert.strictEqual(country.id, 1);
      assert.strictEqual(country.name, 'Russia');
      assert.strictEqual(country.image, 'countries/russia.png');
    });
    
    it('should create a valid CountryList array', () => {
      const countryList: CountryList = [
        {
          id: 1,
          name: 'Russia',
          visible: 1,
          retry: 1,
          rent: 0,
          multiService: 1
        },
        {
          id: 2,
          name: 'Ukraine',
          visible: 1,
          retry: 1,
          rent: 0,
          multiService: 1
        }
      ];
      
      assert.strictEqual(countryList.length, 2);
      assert.strictEqual(countryList[0].name, 'Russia');
    });
    
    it('should create a valid Service object', () => {
      const service: Service = {
        code: 'tg',
        name: 'Telegram',
        image: 'services/telegram.png'
      };
      
      assert.strictEqual(service.code, 'tg');
      assert.strictEqual(service.name, 'Telegram');
      assert.strictEqual(service.image, 'services/telegram.png');
    });
    
    it('should create a valid ServiceList array', () => {
      const serviceList: ServiceList = [
        { code: 'tg', name: 'Telegram' },
        { code: 'wb', name: 'WhatsApp' }
      ];
      
      assert.strictEqual(serviceList.length, 2);
      assert.strictEqual(serviceList[0].code, 'tg');
    });
    
    it('should create a valid CountryService object', () => {
      const countryService: CountryService = {
        serviceCode: 'tg',
        countryId: 1,
        count: 1000,
        price: 15,
        retailPrice: 20
      };
      
      assert.strictEqual(countryService.serviceCode, 'tg');
      assert.strictEqual(countryService.countryId, 1);
      assert.strictEqual(countryService.count, 1000);
    });
    
    it('should create a valid CountryServiceList array', () => {
      const countryServiceList: CountryServiceList = [
        {
          serviceCode: 'tg',
          countryId: 1,
          count: 1000,
          price: 15,
          retailPrice: 20
        },
        {
          serviceCode: 'wb',
          countryId: 1,
          count: 500,
          price: 25,
          retailPrice: 30
        }
      ];
      
      assert.strictEqual(countryServiceList.length, 2);
      assert.strictEqual(countryServiceList[0].serviceCode, 'tg');
      assert.strictEqual(countryServiceList[1].serviceCode, 'wb');
    });
    
    it('should use correct ActivationStatus values', () => {
      assert.strictEqual(ActivationStatus.WAITING_CODE, 'STATUS_WAIT_CODE');
      assert.strictEqual(ActivationStatus.OK, 'STATUS_OK');
    });
    
    it('should create a valid Activation object', () => {
      const activation: Activation = {
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
      
      assert.strictEqual(activation.serviceCode, 'tg');
      assert.strictEqual(activation.phoneNumber, '+79123456789');
      assert.strictEqual(activation.status, 'STATUS_WAIT_CODE');
    });
    
    it('should create a valid ActivationList array', () => {
      const activationList: ActivationList = [
        {
          serviceCode: 'tg',
          countryId: 1,
          operator: 'mts',
          phoneNumber: '+79123456789',
          activationId: 12345,
          activationCost: 15,
          activationTime: '2025-04-20 10:00:00',
          canGetAnotherSms: true,
          status: ActivationStatus.WAITING_CODE
        },
        {
          serviceCode: 'wb',
          countryId: 2,
          operator: 'mts',
          phoneNumber: '+79987654321',
          activationId: 12346,
          activationCost: 25,
          activationTime: '2025-04-20 11:00:00',
          canGetAnotherSms: false,
          status: ActivationStatus.OK,
          sms: '12345'
        }
      ];
      
      assert.strictEqual(activationList.length, 2);
      assert.strictEqual(activationList[0].serviceCode, 'tg');
      assert.strictEqual(activationList[1].sms, '12345');
    });
    
    it('should create a valid CreateActivationParams object', () => {
      const params: CreateActivationParams = {
        serviceCode: 'tg',
        countryId: 1,
        operator: 'mts'
      };
      
      assert.strictEqual(params.serviceCode, 'tg');
      assert.strictEqual(params.countryId, 1);
    });
    
    it('should create a valid UpdateActivationStatusParams object', () => {
      const params: UpdateActivationStatusParams = {
        activationId: 12345,
        status: ActivationStatus.OK,
        sms: '12345'
      };
      
      assert.strictEqual(params.activationId, 12345);
      assert.strictEqual(params.status, 'STATUS_OK');
      assert.strictEqual(params.sms, '12345');
    });
  });
});
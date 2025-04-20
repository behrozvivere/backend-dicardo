/**
 * product.images.test.ts
 * 
 * این فایل برای تست کردن صحت مسیرهای تصویر در نگاشت داده‌های کشورها و سرویس‌ها است.
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import ProductMapper from '../src/modules/products/external/product.mapper';
import { RawCountryData, RawService } from '../src/types';

// مسیر پایه پروژه
const basePath = path.resolve(__dirname, '..');

describe('Product Images Mapping Tests', () => {
  describe('Service Images Mapping', () => {
    it('should map to existing service images', () => {
      const services = [
        { code: 'aa', name: 'Service AA' },
        { code: 'ab', name: 'Service AB' },
        { code: 'ac', name: 'Service AC' },
        { code: 'wa', name: 'WhatsApp' }
      ];
      
      services.forEach(service => {
        // نگاشت سرویس
        const mappedService = ProductMapper.mapService(service as RawService);
        
        // مسیر تصویر بدون '/public'
        const imagePath = mappedService.image?.replace('/public', '');
        
        // مسیر کامل فایل
        const fullPath = path.join(basePath, 'public', imagePath || '');
        
        console.log(`Checking image path for service ${service.code}: ${fullPath}`);
        
        // بررسی وجود فایل تصویر
        expect(fs.existsSync(fullPath), `Image file does not exist for service ${service.code}: ${fullPath}`)
          .to.be.true;
      });
    });
  });
  
  describe('Country Images Mapping', () => {
    it('should correctly format country names for image paths', () => {
      const countries = [
        { 
          id: 1, 
          rus: 'Россия', 
          eng: 'Russia', 
          chn: '俄罗斯', 
          visible: 1, 
          retry: 1, 
          rent: 0, 
          multiService: 1 
        },
        { 
          id: 2, 
          rus: 'Украина', 
          eng: 'Ukraine', 
          chn: '乌克兰', 
          visible: 1, 
          retry: 1, 
          rent: 0, 
          multiService: 1 
        },
        { 
          id: 3, 
          rus: 'Шри-Ланка', 
          eng: 'Sri Lanka', 
          chn: '斯里兰卡', 
          visible: 1, 
          retry: 1, 
          rent: 0, 
          multiService: 1 
        },
        { 
          id: 4, 
          rus: 'Соединенные Штаты', 
          eng: 'United States', 
          chn: '美国', 
          visible: 1, 
          retry: 1, 
          rent: 0, 
          multiService: 1 
        }
      ];
      
      countries.forEach((country, index) => {
        // نگاشت کشور
        const mappedCountry = ProductMapper.mapCountry(country as RawCountryData, index.toString());
        
        console.log(`Country "${country.eng}" mapped to image path: ${mappedCountry.image}`);
        
        // بررسی فرمت صحیح نام فایل تصویر - با حروف بزرگ در ابتدای هر کلمه
        const expectedImageName = country.eng
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('-');
        const expectedPath = `/public/countries/${expectedImageName}.webp`;
        
        expect(mappedCountry.image).to.equal(expectedPath);
        
        // اگر فایل تصویر وجود داشته باشد، بررسی می‌کنیم
        const imagePath = mappedCountry.image?.replace('/public', '');
        const fullPath = path.join(basePath, 'public', imagePath || '');
        
        // فقط گزارش می‌دهیم اما تست را متوقف نمی‌کنیم چون ممکن است همه تصاویر کشورها موجود نباشند
        if (fs.existsSync(fullPath)) {
          console.log(`✅ Image file exists: ${fullPath}`);
        } else {
          console.log(`❌ Image file does not exist: ${fullPath}`);
        }
      });
    });
  });
});
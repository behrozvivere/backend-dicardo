/**
 * ماژول لاگر برای ثبت اعلانات، هشدارها، خطاها و اطلاعات دیباگ
 * این ماژول انواع مختلف پیام‌های لاگ را با فرمت‌بندی مناسب و رنگی ثبت می‌کند
 */

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

/**
 * سطوح لاگ کردن که از کمترین تا بیشترین اهمیت مرتب شده‌اند
 */
export enum LogLevel {
  DEBUG = 0,   // اطلاعات دیباگ برای توسعه‌دهندگان
  INFO = 1,    // اطلاعات عمومی سیستم
  SUCCESS = 2, // پیام‌های موفقیت‌آمیز
  WARN = 3,    // هشدارها
  ERROR = 4,   // خطاهای معمولی
  FATAL = 5,   // خطاهای بحرانی
}

/**
 * تنظیمات رنگ برای هر سطح لاگ
 */
const COLORS = {
  [LogLevel.DEBUG]: '\x1b[36m',    // آبی فیروزه‌ای
  [LogLevel.INFO]: '\x1b[37m',     // سفید
  [LogLevel.SUCCESS]: '\x1b[32m',  // سبز
  [LogLevel.WARN]: '\x1b[33m',     // زرد
  [LogLevel.ERROR]: '\x1b[31m',    // قرمز
  [LogLevel.FATAL]: '\x1b[35m',    // بنفش
  RESET: '\x1b[0m',                // ریست کردن رنگ
};

/**
 * نام‌های سطوح لاگ برای نمایش
 */
const LOG_LEVEL_NAMES = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.SUCCESS]: 'SUCCESS',
  [LogLevel.WARN]: 'WARNING',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
};

/**
 * کلاس اصلی لاگر که مدیریت ثبت پیام‌ها را بر عهده دارد
 */
class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private writeToFile: boolean;
  private logFilePath: string;
  private fileStream: fs.WriteStream | null;

  /**
   * ایجاد یک نمونه از لاگر
   * @param logLevel حداقل سطح لاگی که باید نمایش داده شود
   * @param writeToFile آیا پیام‌ها باید در فایل هم ذخیره شوند؟
   * @param logFilePath مسیر فایل لاگ
   */
  private constructor(
    logLevel: LogLevel = LogLevel.INFO,
    writeToFile: boolean = false,
    logFilePath: string = './logs',
  ) {
    this.logLevel = logLevel;
    this.writeToFile = writeToFile;
    this.logFilePath = logFilePath;
    this.fileStream = null;

    if (this.writeToFile) {
      this.setupFileLogging();
    }
  }

  /**
   * دریافت تنها نمونه از لاگر (الگوی Singleton)
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * پیکربندی لاگر
   * @param options گزینه‌های پیکربندی
   */
  public configure({
    logLevel = LogLevel.INFO,
    writeToFile = false,
    logFilePath = './logs',
  }: {
    logLevel?: LogLevel;
    writeToFile?: boolean;
    logFilePath?: string;
  }): void {
    this.logLevel = logLevel;
    
    // اگر حالت لاگ فایل تغییر کرده
    if (this.writeToFile !== writeToFile) {
      this.writeToFile = writeToFile;
      
      // اگر قبلاً به فایل می‌نوشتیم، فایل‌استریم را ببندیم
      if (!this.writeToFile && this.fileStream) {
        this.fileStream.end();
        this.fileStream = null;
      } 
      // اگر الان باید به فایل بنویسیم، فایل‌استریم را راه‌اندازی کنیم
      else if (this.writeToFile) {
        this.logFilePath = logFilePath;
        this.setupFileLogging();
      }
    } 
    // اگر مسیر فایل تغییر کرده ولی همچنان می‌خواهیم به فایل بنویسیم
    else if (this.writeToFile && this.logFilePath !== logFilePath) {
      if (this.fileStream) {
        this.fileStream.end();
      }
      this.logFilePath = logFilePath;
      this.setupFileLogging();
    }
  }

  /**
   * آماده‌سازی لاگ کردن به فایل
   */
  private setupFileLogging(): void {
    try {
      // ایجاد پوشه لاگ اگر وجود نداشته باشد
      if (!fs.existsSync(this.logFilePath)) {
        fs.mkdirSync(this.logFilePath, { recursive: true });
      }

      // ایجاد نام فایل بر اساس تاریخ
      const now = new Date();
      const fileName = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.log`;
      
      const fullPath = path.join(this.logFilePath, fileName);
      
      // ایجاد یا باز کردن فایل برای نوشتن
      this.fileStream = fs.createWriteStream(fullPath, { flags: 'a' });
      
      this.fileStream.on('error', (err) => {
        console.error('خطا در نوشتن به فایل لاگ:', err);
        this.writeToFile = false;
        this.fileStream = null;
      });
      
    } catch (err) {
      console.error('خطا در راه‌اندازی فایل لاگ:', err);
      this.writeToFile = false;
    }
  }

  /**
   * لاگ کردن یک پیام با سطح مشخص
   * @param level سطح لاگ
   * @param message پیام اصلی
   * @param optionalParams پارامترهای اضافی برای لاگ
   */
  private log(level: LogLevel, message: string, ...optionalParams: any[]): void {
    // اگر سطح لاگ کمتر از حداقل سطح تنظیم شده است، نمایش ندهیم
    if (level < this.logLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level];
    const color = COLORS[level];
    const resetColor = COLORS.RESET;

    // فرمت‌بندی پیام
    const formattedMessage = `[${timestamp}] [${levelName}] ${message}`;
    
    // نمایش در کنسول با رنگ مناسب
    console.log(`${color}${formattedMessage}${resetColor}`, ...optionalParams);

    // نوشتن به فایل بدون رنگ
    if (this.writeToFile && this.fileStream) {
      const logEntry = `${formattedMessage} ${optionalParams.length ? util.format(...optionalParams) : ''}\n`;
      this.fileStream.write(logEntry);
    }
  }

  /**
   * لاگ کردن پیام دیباگ
   * @param message پیام
   * @param optionalParams پارامترهای اضافی
   */
  public debug(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.DEBUG, message, ...optionalParams);
  }

  /**
   * لاگ کردن پیام اطلاعاتی
   * @param message پیام
   * @param optionalParams پارامترهای اضافی
   */
  public info(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.INFO, message, ...optionalParams);
  }

  /**
   * لاگ کردن پیام موفقیت
   * @param message پیام
   * @param optionalParams پارامترهای اضافی
   */
  public success(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.SUCCESS, message, ...optionalParams);
  }

  /**
   * لاگ کردن هشدار
   * @param message پیام
   * @param optionalParams پارامترهای اضافی
   */
  public warn(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.WARN, message, ...optionalParams);
  }

  /**
   * لاگ کردن خطا
   * @param message پیام
   * @param optionalParams پارامترهای اضافی (مثلاً آبجکت خطا)
   */
  public error(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.ERROR, message, ...optionalParams);
  }

  /**
   * لاگ کردن خطای بحرانی
   * @param message پیام
   * @param optionalParams پارامترهای اضافی
   */
  public fatal(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.FATAL, message, ...optionalParams);
  }

  /**
   * لاگ کردن یک خطا با جزئیات کامل
   * @param error آبجکت خطا
   * @param context اطلاعات زمینه
   */
  public logError(error: Error, context: string = 'عمومی'): void {
    const errorDetail = `${error.name}: ${error.message}\n${error.stack || 'بدون استک'}`;
    this.error(`خطا در ${context}`, errorDetail);
  }

  /**
   * شروع یک بخش جدید در لاگ با یک عنوان مشخص
   * مفید برای جداسازی بخش‌های مختلف لاگ
   * @param sectionName نام بخش
   */
  public startSection(sectionName: string): void {
    const separator = '-'.repeat(50);
    this.info(`\n${separator}\n${sectionName}\n${separator}`);
  }

  /**
   * بستن فایل لاگ (در صورت نیاز به پایان دادن پروسه لاگینگ)
   */
  public close(): void {
    if (this.fileStream) {
      this.fileStream.end();
      this.fileStream = null;
    }
  }
}

// ایجاد یک نمونه برای استفاده در کل برنامه
const logger = Logger.getInstance();

// صادر کردن کلاس و نمونه پیش‌فرض
export { Logger };
export default logger;
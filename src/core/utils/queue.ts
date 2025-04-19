/**
 * ماژول مدیریت صف درخواست‌ها
 * این ماژول امکان مدیریت صف وظایف، اجرای همزمان با محدودیت، و تلاش مجدد را فراهم می‌کند
 * و برای مدیریت درخواست‌های API، پردازش‌های سنگین یا عملیات‌های ناهمزمان مناسب است
 * 
 * @module Queue
 */

import logger from './logger';

/**
 * نوع تابع وظیفه که در صف قرار می‌گیرد
 * این توابع می‌توانند هر نوع محتوایی را بازگردانند
 */
export type TaskFunction<T = any> = (...args: any[]) => Promise<T>;

/**
 * نوع داده تنظیمات صف
 */
export interface QueueOptions {
  /** حداکثر تعداد وظایفی که می‌توانند همزمان اجرا شوند */
  concurrency: number;
  /** حداکثر تعداد تلاش‌های مجدد برای اجرای یک وظیفه در صورت خطا */
  maxRetries: number;
  /** زمان انتظار (به میلی‌ثانیه) بین تلاش‌های مجدد */
  retryDelay: number;
  /** نام صف (برای لاگ کردن و دیباگ) */
  name: string;
  /** آیا خطاها به صورت خودکار لاگ شوند؟ */
  logErrors: boolean;
}

/**
 * نوع داده وظیفه در صف
 */
interface QueueTask<T = any> {
  /** شناسه منحصر به فرد وظیفه */
  id: string;
  /** تابعی که باید اجرا شود */
  fn: TaskFunction<T>;
  /** آرگومان‌های تابع */
  args: any[];
  /** شمارنده تلاش‌های انجام شده */
  attempts: number;
  /** تابع resolve از Promise */
  resolve: (value: T) => void;
  /** تابع reject از Promise */
  reject: (reason: any) => void;
  /** زمان افزوده شدن به صف */
  addedAt: Date;
  /** زمان شروع اجرا (در صورتی که شروع شده باشد) */
  startedAt?: Date;
  /** اولویت وظیفه (عدد بالاتر = اولویت بیشتر) */
  priority: number;
}

/**
 * وضعیت‌های ممکن برای صف
 */
export enum QueueState {
  IDLE = 'idle',        // بیکار - هیچ وظیفه‌ای در حال اجرا نیست
  RUNNING = 'running',  // در حال اجرا - حداقل یک وظیفه در حال اجراست
  PAUSED = 'paused',    // متوقف - اجرای وظایف موقتاً متوقف شده 
  STOPPED = 'stopped'   // متوقف - صف کاملاً متوقف شده و نمی‌توان وظیفه جدیدی افزود
}

/**
 * کلاس مدیریت صف درخواست‌ها
 * این کلاس امکان اجرای همزمان وظایف با محدودیت تعداد را فراهم می‌کند
 */
export class Queue {
  private tasks: QueueTask[] = [];          // لیست وظایف در صف
  private activeCount: number = 0;          // تعداد وظایف در حال اجرا
  private state: QueueState = QueueState.IDLE; // وضعیت فعلی صف
  private options: QueueOptions;            // تنظیمات صف

  /**
   * سازنده کلاس Queue
   * @param options تنظیمات صف
   */
  constructor(options?: Partial<QueueOptions>) {
    // تنظیمات پیش‌فرض
    this.options = {
      concurrency: 5,      // حداکثر 5 وظیفه همزمان
      maxRetries: 3,       // حداکثر 3 بار تلاش مجدد
      retryDelay: 1000,    // 1 ثانیه تاخیر بین تلاش‌ها
      name: 'default-queue', // نام پیش‌فرض
      logErrors: true,     // لاگ کردن خطاها به صورت خودکار
      ...options           // ترکیب با تنظیمات دلخواه
    };

    logger.debug(`صف "${this.options.name}" با موفقیت ایجاد شد`, {
      concurrency: this.options.concurrency,
      maxRetries: this.options.maxRetries
    });
  }

  /**
   * افزودن یک وظیفه به صف
   * @param fn تابعی که باید اجرا شود
   * @param args آرگومان‌های تابع
   * @param priority اولویت وظیفه (عدد بالاتر = اولویت بیشتر)
   * @returns یک Promise که نتیجه اجرای وظیفه را برمی‌گرداند
   */
  public add<T>(fn: TaskFunction<T>, args: any[] = [], priority: number = 0): Promise<T> {
    if (this.state === QueueState.STOPPED) {
      return Promise.reject(new Error('صف متوقف شده و نمی‌تواند وظیفه جدید بپذیرد'));
    }

    return new Promise<T>((resolve, reject) => {
      // ایجاد وظیفه جدید
      const task: QueueTask<T> = {
        id: this.generateTaskId(),
        fn,
        args,
        attempts: 0,
        resolve,
        reject,
        addedAt: new Date(),
        priority
      };

      // افزودن به صف با رعایت اولویت
      this.addTaskWithPriority(task);

      // اگر صف در حالت اجرا است و ظرفیت داریم، پردازش را شروع کنیم
      if (this.state === QueueState.RUNNING && this.activeCount < this.options.concurrency) {
        this.processQueue();
      }
      
      logger.debug(`وظیفه جدید به صف "${this.options.name}" اضافه شد`, {
        taskId: task.id,
        priority,
        queueLength: this.tasks.length
      });
    });
  }

  /**
   * افزودن وظیفه با رعایت اولویت به صف
   * وظایف با اولویت بالاتر در ابتدای صف قرار می‌گیرند
   * @param task وظیفه‌ای که باید افزوده شود
   */
  private addTaskWithPriority(task: QueueTask): void {
    // پیدا کردن مکان مناسب برای وظیفه جدید بر اساس اولویت
    let insertIndex = this.tasks.length;
    
    for (let i = 0; i < this.tasks.length; i++) {
      if (task.priority > this.tasks[i].priority) {
        insertIndex = i;
        break;
      }
    }
    
    // افزودن وظیفه در مکان مناسب
    this.tasks.splice(insertIndex, 0, task);
  }

  /**
   * شروع پردازش صف
   */
  public start(): void {
    if (this.state === QueueState.STOPPED) {
      logger.warn(`نمی‌توان صف "${this.options.name}" را که کاملاً متوقف شده مجدداً شروع کرد`);
      return;
    }
    
    this.state = QueueState.RUNNING;
    logger.info(`صف "${this.options.name}" شروع به کار کرد`);
    this.processQueue();
  }

  /**
   * توقف موقت پردازش صف
   * وظایف در حال اجرا تا پایان ادامه می‌یابند اما وظایف جدید شروع نمی‌شوند
   */
  public pause(): void {
    if (this.state === QueueState.RUNNING) {
      this.state = QueueState.PAUSED;
      logger.info(`صف "${this.options.name}" موقتاً متوقف شد`);
    }
  }

  /**
   * توقف کامل صف
   * وظایف در حال اجرا تا پایان ادامه می‌یابند ولی وظایف باقی‌مانده در صف رد می‌شوند
   */
  public stop(): void {
    this.state = QueueState.STOPPED;
    
    // رد کردن همه وظایف باقی‌مانده
    const tasksToReject = [...this.tasks];
    this.tasks = [];
    
    tasksToReject.forEach(task => {
      task.reject(new Error('صف متوقف شد و این وظیفه اجرا نخواهد شد'));
    });
    
    logger.info(`صف "${this.options.name}" کاملاً متوقف شد، ${tasksToReject.length} وظیفه رد شد`);
  }

  /**
   * پاک کردن صف بدون توقف آن
   * وظایف در حال اجرا ادامه می‌یابند ولی وظایف در انتظار از صف حذف می‌شوند
   */
  public clear(): void {
    const tasksToReject = [...this.tasks];
    this.tasks = [];
    
    tasksToReject.forEach(task => {
      task.reject(new Error('صف پاک شد و این وظیفه اجرا نخواهد شد'));
    });
    
    logger.info(`صف "${this.options.name}" پاک شد، ${tasksToReject.length} وظیفه رد شد`);
  }

  /**
   * پردازش وظایف صف
   * این تابع وظایف را با توجه به محدودیت همزمانی اجرا می‌کند
   */
  private processQueue(): void {
    // اگر صف متوقف یا پاز شده است، پردازش انجام نمی‌شود
    if (this.state !== QueueState.RUNNING) {
      return;
    }

    // تا زمانی که ظرفیت داریم و وظیفه‌ای در صف وجود دارد، وظایف را اجرا می‌کنیم
    while (
      this.state === QueueState.RUNNING &&
      this.tasks.length > 0 && 
      this.activeCount < this.options.concurrency
    ) {
      const task = this.tasks.shift();
      if (!task) continue;

      // افزایش شمارنده وظایف فعال
      this.activeCount++;
      
      // تنظیم زمان شروع
      task.startedAt = new Date();
      task.attempts++;
      
      // لاگ کردن شروع اجرای وظیفه
      logger.debug(`شروع اجرای وظیفه در صف "${this.options.name}"`, {
        taskId: task.id,
        attempt: task.attempts
      });
      
      // اجرای وظیفه
      this.executeTask(task);
    }
    
    // اگر هیچ وظیفه‌ای در حال اجرا نیست و صف خالی است، وضعیت را به IDLE تغییر می‌دهیم
    if (this.activeCount === 0 && this.tasks.length === 0) {
      this.state = QueueState.IDLE;
      logger.debug(`صف "${this.options.name}" وارد حالت بیکار شد`);
    }
  }

  /**
   * اجرای یک وظیفه
   * @param task وظیفه‌ای که باید اجرا شود
   */
  private executeTask(task: QueueTask): void {
    // فراخوانی تابع وظیفه با آرگومان‌های آن
    Promise.resolve()
      .then(() => task.fn(...task.args))
      .then(result => {
        // وظیفه با موفقیت انجام شد
        logger.debug(`وظیفه در صف "${this.options.name}" با موفقیت تکمیل شد`, {
          taskId: task.id,
          attempt: task.attempts
        });
        
        // کاهش شمارنده وظایف فعال و فراخوانی resolve تابع
        this.activeCount--;
        task.resolve(result);
        
        // ادامه پردازش صف
        this.processQueue();
      })
      .catch(error => {
        // خطا در اجرای وظیفه
        if (this.options.logErrors) {
          logger.error(`خطا در اجرای وظیفه در صف "${this.options.name}"`, {
            taskId: task.id,
            attempt: task.attempts,
            error: error.message
          });
        }
        
        // بررسی امکان تلاش مجدد
        if (task.attempts < this.options.maxRetries) {
          // افزودن مجدد وظیفه به صف برای تلاش بعدی با تاخیر
          logger.debug(`تلاش مجدد برای وظیفه در صف "${this.options.name}"`, {
            taskId: task.id,
            attempt: task.attempts,
            maxRetries: this.options.maxRetries
          });
          
          setTimeout(() => {
            // وظیفه را با همان اولویت به صف اضافه می‌کنیم
            this.addTaskWithPriority(task);
            
            // کاهش شمارنده وظایف فعال و ادامه پردازش صف
            this.activeCount--;
            this.processQueue();
          }, this.options.retryDelay);
        } else {
          // حداکثر تعداد تلاش‌ها انجام شده، وظیفه را رد می‌کنیم
          logger.warn(`وظیفه در صف "${this.options.name}" پس از ${task.attempts} تلاش ناموفق رد شد`, {
            taskId: task.id,
            error: error.message
          });
          
          // کاهش شمارنده وظایف فعال و فراخوانی reject تابع
          this.activeCount--;
          task.reject(error);
          
          // ادامه پردازش صف
          this.processQueue();
        }
      });
  }

  /**
   * تولید یک شناسه منحصر به فرد برای وظیفه
   * @returns شناسه وظیفه
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * دریافت وضعیت فعلی صف
   */
  public getState(): QueueState {
    return this.state;
  }

  /**
   * دریافت آمار صف
   * @returns آمار صف
   */
  public getStats() {
    return {
      state: this.state,
      queued: this.tasks.length,
      active: this.activeCount,
      capacity: this.options.concurrency,
      name: this.options.name
    };
  }

  /**
   * دریافت تعداد وظایف در انتظار
   */
  public get pendingCount(): number {
    return this.tasks.length;
  }

  /**
   * دریافت تعداد وظایف در حال اجرا
   */
  public get activeTaskCount(): number {
    return this.activeCount;
  }
}

/**
 * ایجاد یک نمونه پیش‌فرض از صف برای استفاده در کل برنامه
 */
const defaultQueue = new Queue();

export default defaultQueue;
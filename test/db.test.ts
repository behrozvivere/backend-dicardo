import { supabaseService, supabaseAdmin } from '../src/config';
import { supabaseConfig } from '../src/config/env';

/**
 * تعریف interface برای ستون‌های جدول
 */
interface TableColumn {
  column_name: string;
  data_type: string;
}

/**
 * اسکریپت آزمایشی اتصال و بررسی پایگاه داده
 */
async function testDatabaseConnection() {
  console.log('در حال آزمایش اتصال به Supabase...');

  // آزمایش اتصال اولیه
  const isConnected = await supabaseService.testConnection();
  
  if (!isConnected) {
    console.error('خطا در اتصال به Supabase. لطفاً تنظیمات را بررسی کنید.');
    return;
  }

  console.log('اتصال به Supabase با موفقیت برقرار شد.');
  
  // دریافت لیست جدول‌ها
  try {
    console.log('در حال دریافت لیست جدول‌های دیتابیس...');
    
    // استفاده از تابع RPC برای دریافت لیست جدول‌ها (این روش برای Supabase مناسب‌تر است)
    const { data: tables, error } = await supabaseAdmin.rpc('get_tables');
    
    // اگر تابع RPC وجود نداشت، از SQL خام استفاده می‌کنیم
    if (error && error.message.includes('does not exist')) {
      console.log('در حال استفاده از روش جایگزین برای دریافت لیست جداول...');
      
      // استفاده از SQL خام برای دریافت لیست جداول
      const { data: rawTables, error: rawError } = await supabaseAdmin.from('_tables').select('*');
      
      if (rawError) {
        console.log('تلاش دوباره با SQL خام...');
        
        // تلاش با استفاده از SQL خام
        const { data: sqlTables, error: sqlError } = await supabaseAdmin.rpc('query', {
          query_text: `
            SELECT tablename, schemaname 
            FROM pg_catalog.pg_tables 
            WHERE schemaname = 'public'
          `,
        });
        
        if (sqlError) {
          console.error('خطا در دریافت لیست جدول‌ها:', sqlError.message);
          
          // تلاش نهایی: فقط نمایش اطلاعات اتصال
          console.log('\n===== اطلاعات اتصال به Supabase =====');
          console.log(`URL: ${supabaseConfig.url}`);
          console.log('اتصال: موفق');
          console.log('\nبرای دریافت لیست جداول، ممکن است نیاز به دسترسی‌های بیشتری باشد یا باید');
          console.log('از طریق داشبورد Supabase به اطلاعات جداول دسترسی پیدا کنید.');
          
          return;
        }
        
        displayTableInfo(sqlTables);
        return;
      }
      
      displayTableInfo(rawTables);
      return;
    }
    
    // نمایش اطلاعات جداول
    displayTableInfo(tables);
    
  } catch (err: any) {
    console.error('خطای غیرمنتظره در بررسی دیتابیس:', err.message);
  }
}

/**
 * نمایش اطلاعات جداول
 */
async function displayTableInfo(tables: any[]) {
  if (!tables || tables.length === 0) {
    console.log('هیچ جدولی در پایگاه داده یافت نشد.');
    return;
  }
  
  console.log(`===== لیست جدول‌های موجود در پایگاه داده (${tables.length} جدول) =====`);
  tables.forEach((table, index) => {
    // سازگاری با فرمت‌های مختلف خروجی
    const tableName = table.tablename || table.name || table.table_name;
    const schemaName = table.schemaname || table.schema || 'public';
    console.log(`${index + 1}. ${tableName} (در اسکیما: ${schemaName})`);
  });
  
  // برای هر جدول، تلاش می‌کنیم اطلاعات بیشتری نمایش دهیم
  console.log('\n===== اطلاعات بیشتر درباره جدول‌ها =====');
  
  for (const table of tables) {
    // سازگاری با فرمت‌های مختلف خروجی
    const tableName = table.tablename || table.name || table.table_name;
    if (!tableName) continue;
    
    try {
      // دریافت تعداد رکوردها
      const { count, error: countError } = await supabaseAdmin
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`خطا در شمارش رکوردهای جدول ${tableName}:`, countError.message);
        continue;
      }
      
      console.log(`\nجدول: ${tableName}`);
      console.log(`تعداد رکوردها: ${count !== null ? count : 'نامشخص'}`);
      
      // تلاش برای دریافت ساختار جدول (ممکن است کار نکند بسته به دسترسی‌ها)
      try {
        const { data: columns, error: columnError } = await supabaseAdmin
          .from('_columns')
          .select('*')
          .eq('table', tableName);
        
        if (!columnError && columns && columns.length) {
          console.log('ستون‌ها:');
          columns.forEach((col: any) => {
            const columnName = col.column_name || col.name;
            const dataType = col.data_type || col.type;
            console.log(`  - ${columnName} (${dataType})`);
          });
        }
      } catch (colErr) {
        // اگر نتوانستیم اطلاعات ستون‌ها را دریافت کنیم، پیغام خطا را نمایش نمی‌دهیم
      }
      
    } catch (err) {
      // اگر نتوانستیم اطلاعات جدول را دریافت کنیم، به جدول بعدی می‌رویم
      continue;
    }
  }
}

// اجرای اسکریپت
testDatabaseConnection()
  .then(() => {
    console.log('\nبررسی دیتابیس به پایان رسید.');
    process.exit(0);
  })
  .catch(err => {
    console.error('خطا در اجرای اسکریپت:', err);
    process.exit(1);
  });
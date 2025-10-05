# إعداد قاعدة البيانات - ToDoOS

## 📋 أنواع قواعد البيانات المدعومة

يدعم نظام ToDoOS أربعة أنواع من قواعد البيانات:

### 🗄️ SQL Server
- **الملف**: `create_tables.sql`
- **المنفذ الافتراضي**: 1433
- **المتطلبات**: SQL Server 2019+ و SSMS

### 🐬 MySQL
- **الملف**: `mysql_create_tables.sql`
- **المنفذ الافتراضي**: 3306
- **المتطلبات**: MySQL 8.0+ و MySQL Workbench

### 🐘 PostgreSQL
- **الملف**: `postgresql_create_tables.sql`
- **المنفذ الافتراضي**: 5432
- **المتطلبات**: PostgreSQL 13+ و pgAdmin

### 🏛️ Oracle
- **الملف**: `oracle_create_tables.sql`
- **المنفذ الافتراضي**: 1521
- **المتطلبات**: Oracle 19c+ و SQL Developer

---

## 🚀 خطوات الإعداد

### 📊 SQL Server

#### 1. إنشاء قاعدة البيانات
```sql
-- في SQL Server Management Studio
CREATE DATABASE ToDoOS
COLLATE Arabic_CI_AS;
```

#### 2. تنفيذ السكريبت
1. افتح **SQL Server Management Studio**
2. اتصل بخادم SQL Server
3. افتح ملف `create_tables.sql`
4. تأكد من اختيار قاعدة البيانات `ToDoOS`
5. نفذ السكريبت بالضغط على **F5**

#### 3. التحقق من الجداول
```sql
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

### 🐬 MySQL

#### 1. إنشاء قاعدة البيانات
```sql
-- في MySQL Workbench
CREATE DATABASE ToDoOS
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

#### 2. تنفيذ السكريبت
1. افتح **MySQL Workbench**
2. اتصل بخادم MySQL
3. افتح ملف `mysql_create_tables.sql`
4. نفذ السكريبت

#### 3. التحقق من الجداول
```sql
USE ToDoOS;
SHOW TABLES;
```

### 🐘 PostgreSQL

#### 1. إنشاء قاعدة البيانات
```sql
-- في pgAdmin أو psql
CREATE DATABASE todoos
WITH ENCODING 'UTF8'
LC_COLLATE = 'en_US.UTF-8'
LC_CTYPE = 'en_US.UTF-8';
```

#### 2. تنفيذ السكريبت
1. افتح **pgAdmin** أو استخدم **psql**
2. اتصل بخادم PostgreSQL
3. افتح ملف `postgresql_create_tables.sql`
4. نفذ السكريبت

#### 3. التحقق من الجداول
```sql
\c todoos
\dt
```

### 🏛️ Oracle

#### 1. إنشاء قاعدة البيانات
```sql
-- في SQL Developer
CREATE USER todoos IDENTIFIED BY password;
GRANT CONNECT, RESOURCE, DBA TO todoos;
```

#### 2. تنفيذ السكريبت
1. افتح **Oracle SQL Developer**
2. اتصل بخادم Oracle
3. افتح ملف `oracle_create_tables.sql`
4. نفذ السكريبت

#### 3. التحقق من الجداول
```sql
SELECT table_name FROM user_tables ORDER BY table_name;
```

## 📊 الجداول المنشأة

### الجداول الأساسية:
- **users** - المستخدمين
- **boards** - اللوحات
- **columns** - الأعمدة
- **cards** - البطاقات/المهام
- **card_members** - أعضاء البطاقات
- **board_members** - أعضاء اللوحات

### جداول الأنشطة:
- **activities** - سجل الأنشطة
- **time_entries** - تسجيل الوقت
- **comments** - التعليقات
- **notifications** - الإشعارات

### جداول المرفقات:
- **attachments** - المرفقات

### جداول الإعدادات:
- **system_settings** - إعدادات النظام
- **email_configs** - إعدادات البريد الإلكتروني
- **database_configs** - إعدادات قاعدة البيانات

### جداول متقدمة:
- **recurring_tasks** - المهام المتكررة

## 👤 المستخدم الافتراضي

بعد تنفيذ السكريبت، سيتم إنشاء مستخدم إداري افتراضي:

- **اسم المستخدم**: `admin`
- **البريد الإلكتروني**: `admin@todoos.com`
- **كلمة المرور**: `admin123` (يجب تغييرها فوراً)
- **الدور**: مدير النظام

## 🔧 إعداد الاتصال في التطبيق

1. اذهب إلى **إعدادات النظام** في التطبيق
2. تبويب **إعدادات قاعدة البيانات**
3. املأ البيانات:
   - **نوع قاعدة البيانات**: SQL Server
   - **عنوان الخادم**: localhost (أو IP الخادم)
   - **المنفذ**: 1433
   - **اسم قاعدة البيانات**: ToDoOS
   - **اسم المستخدم**: sa (أو المستخدم المناسب)
   - **كلمة المرور**: كلمة مرور المستخدم

4. انقر **اختبار الاتصال**
5. احفظ الإعدادات

## 🔒 الأمان

### تشفير كلمات المرور:
- كلمات مرور المستخدمين مشفرة باستخدام bcrypt
- كلمات مرور الإعدادات (البريد الإلكتروني، قاعدة البيانات) يجب تشفيرها

### صلاحيات قاعدة البيانات:
```sql
-- إنشاء مستخدم خاص للتطبيق
CREATE LOGIN todoos_app WITH PASSWORD = 'StrongPassword123!';
CREATE USER todoos_app FOR LOGIN todoos_app;

-- منح الصلاحيات المطلوبة
ALTER ROLE db_datareader ADD MEMBER todoos_app;
ALTER ROLE db_datawriter ADD MEMBER todoos_app;
ALTER ROLE db_ddladmin ADD MEMBER todoos_app;
```

## 📈 الصيانة

### النسخ الاحتياطي:
```sql
-- نسخة احتياطية يومية
BACKUP DATABASE ToDoOS 
TO DISK = 'C:\Backup\ToDoOS_Full.bak'
WITH FORMAT, INIT;
```

### تحسين الأداء:
```sql
-- إعادة بناء الفهارس
ALTER INDEX ALL ON users REBUILD;
ALTER INDEX ALL ON cards REBUILD;
ALTER INDEX ALL ON activities REBUILD;
```

## 🐛 استكشاف الأخطاء

### خطأ في الاتصال:
1. تأكد من تشغيل SQL Server
2. تحقق من إعدادات الشبكة
3. تأكد من صحة بيانات الاتصال

### خطأ في الصلاحيات:
1. تأكد من صلاحيات المستخدم
2. تحقق من إعدادات الأمان في SQL Server

### خطأ في إنشاء الجداول:
1. تأكد من اختيار قاعدة البيانات الصحيحة
2. تحقق من عدم وجود جداول بنفس الأسماء
3. تأكد من صلاحيات إنشاء الجداول

## 📞 الدعم

في حالة مواجهة مشاكل:
1. تحقق من سجلات SQL Server
2. راجع رسائل الخطأ في التطبيق
3. تأكد من متطلبات النظام

---

## 🎯 ملاحظات مهمة

- **النسخ الاحتياطي**: قم بعمل نسخة احتياطية قبل أي تحديث
- **الأمان**: غير كلمة مرور المدير الافتراضية فوراً
- **الأداء**: راقب أداء قاعدة البيانات بانتظام
- **التحديثات**: احتفظ بنسخة من سكريبت الجداول للمراجع المستقبلية

**🚀 بعد إكمال هذه الخطوات، سيكون نظام ToDoOS جاهزاً للاستخدام مع قاعدة بيانات كاملة!**

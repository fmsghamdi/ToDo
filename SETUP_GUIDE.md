# 🚀 دليل تشغيل نظام ToDoOS مع قاعدة البيانات

## 📋 **المتطلبات:**

### **1. البرامج المطلوبة:**
- ✅ **SQL Server** (أو SQL Server Express)
- ✅ **.NET 9.0 SDK**
- ✅ **Node.js** (v18 أو أحدث)
- ✅ **Visual Studio Code** (اختياري)

### **2. التحقق من التثبيت:**
```bash
# تحقق من .NET
dotnet --version

# تحقق من Node.js
node --version
npm --version
```

## 🗄️ **إعداد قاعدة البيانات:**

### **الخطوة 1: إنشاء قاعدة البيانات**
```sql
-- افتح SQL Server Management Studio وشغل:
CREATE DATABASE ToDoOS;
```

### **الخطوة 2: تشغيل سكريبت الجداول**
```bash
# من مجلد المشروع
cd database
# شغل أحد هذه الملفات في SQL Server:
# - create_tables_simple.sql (الأبسط - مُوصى به)
# - create_tables.sql (كامل)
```

### **الخطوة 3: إضافة بيانات تجريبية**
```sql
-- إضافة مستخدم افتراضي
INSERT INTO users (username, email, full_name, password_hash, avatar, created_at, updated_at)
VALUES ('admin', 'admin@todoos.com', 'مدير النظام', 'hashed_password', '👨‍💼', GETDATE(), GETDATE());
```

## 🔧 **تشغيل النظام:**

### **الخطوة 1: تشغيل API Server (Backend)**
```bash
# افتح Terminal جديد
cd src/TaqTask.Api

# استعادة الحزم
dotnet restore

# تشغيل الخادم
dotnet run
```

**✅ يجب أن ترى:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
      Now listening on: https://localhost:5001
```

### **الخطوة 2: تشغيل Frontend**
```bash
# افتح Terminal آخر
cd web

# تثبيت الحزم (أول مرة فقط)
npm install

# تشغيل التطبيق
npm run dev
```

**✅ يجب أن ترى:**
```
  Local:   http://localhost:5173/
  Network: use --host to expose
```

## 🎯 **اختبار الاتصال:**

### **1. اختبار API Server:**
افتح المتصفح واذهب إلى:
```
http://localhost:5000/api/health
```

**✅ يجب أن ترى:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-02T06:55:00Z",
  "message": "API Server is running"
}
```

### **2. اختبار Frontend:**
افتح المتصفح واذهب إلى:
```
http://localhost:5173/
```

### **3. التحقق من حالة البيانات:**
في لوحة التحكم، انظر لأعلى اليمين:

**🟢 إذا رأيت:** `🗄️ قاعدة البيانات` = **نجح الاتصال!** ✅
**🟡 إذا رأيت:** `💾 حفظ محلي` = **لم يتصل بعد** ❌

## 🔍 **استكشاف الأخطاء:**

### **مشكلة: API Server لا يعمل**
```bash
# تحقق من المنفذ
netstat -an | findstr :5000

# تحقق من الأخطاء
cd src/TaqTask.Api
dotnet build
```

### **مشكلة: خطأ في قاعدة البيانات**
1. **تحقق من connection string** في `appsettings.json`
2. **تأكد من تشغيل SQL Server**
3. **تحقق من اسم قاعدة البيانات** (ToDoOS)

### **مشكلة: CORS Error**
تأكد من أن API Server يعمل على المنفذ الصحيح (5000)

## 📊 **كيف تعرف أن النظام يعمل بقاعدة البيانات:**

### **✅ علامات النجاح:**
1. **المؤشر أخضر** 🟢 في لوحة التحكم
2. **البيانات تظهر في متصفحات مختلفة**
3. **البيانات تبقى بعد إعادة تشغيل المتصفح**
4. **ترى استعلامات HTTP في Network tab (F12)**

### **❌ علامات الفشل:**
1. **المؤشر أصفر** 🟡 (ما زال محلي)
2. **البيانات لا تظهر في متصفحات أخرى**
3. **البيانات تختفي بعد مسح cache**

## 🎉 **بعد النجاح:**

### **الآن يمكنك:**
- ✅ **إنشاء مهام** تُحفظ في قاعدة البيانات
- ✅ **الوصول من أجهزة متعددة**
- ✅ **العمل الجماعي** على نفس البيانات
- ✅ **النسخ الاحتياطي** التلقائي
- ✅ **الأمان المتقدم**

### **للنشر على الخادم:**
1. **رفع الملفات** للخادم
2. **إعداد IIS** أو **Nginx**
3. **تحديث connection string** لقاعدة البيانات الحقيقية
4. **تشغيل النظام** في وضع الإنتاج

## 📞 **الدعم:**

إذا واجهت أي مشاكل:
1. **تحقق من الـ logs** في Terminal
2. **افتح F12** وانظر للأخطاء
3. **تأكد من تشغيل جميع الخدمات**

---

## 🎯 **ملخص سريع:**

```bash
# Terminal 1 - API Server
cd src/TaqTask.Api
dotnet run

# Terminal 2 - Frontend  
cd web
npm run dev

# المتصفح
http://localhost:5173/
```

**🎉 إذا رأيت 🟢 قاعدة البيانات في لوحة التحكم = نجح كل شيء!**

# ToDoOS - سجل التحديثات (الجلسة الحالية)

## التاريخ: 21 مايو 2026

---

## 1. التسجيل التلقائي للمؤسسات (SaaS Multi-Tenant)

### المشكلة
كل مستخدم جديد كان ينضم إلى نفس المؤسسة (Tenant 1 - ToDoOS). المطلوب تحويل النظام إلى SaaS حقيقي حيث كل تسجيل ينشئ مؤسسة جديدة.

### التغييرات

**Backend - `src/TaqTask.Api/Controllers/AuthController.cs`:**
- تعديل `POST /api/auth/register`: عندما يكون `tenantId = 0` يتم إنشاء مؤسسة جديدة تلقائياً:
  - للمستخدم الفردي (`accountType = "individual"`): `MaxUsers = 1`
  - للشركات (`accountType = "company"`): `MaxUsers = 25`
  - يتم إنشاء subdomain فريد من اسم المستخدم
  - يتم تفعيل الاشتراك التجريبي تلقائياً (`InitializeTenantSubscriptionAsync`)
  - المستخدم يُنشأ كـ `admin` للمؤسسة الجديدة ويعاد JWT token
- إضافة حقل `AccountType` و `Role` إلى `RegisterRequest` DTO

**Frontend - `web/src/App.tsx`:**
- `handleRegister`: يستخدم API (`apiService.register()`) بدلاً من localStorage فقط
- بعد التسجيل API، يتم تعيين `currentUserId` تلقائياً (دخول مباشر)
- إضافة `restoreToken()` للحفاظ على توكن المدير عند إضافة مستخدمين جدد

**Frontend - `web/src/pages/TenantRegister.tsx`:**
- إضافة حقول: اسم المدير (`fullName`) وكلمة المرور (`password`)
- بعد إنشاء المؤسسة (`registerTenant`)، يتم إنشاء المستخدم كمدير (`register` مع `tenantId`)
- إعادة التوجيه إلى صفحة تسجيل الدخول بعد النجاح

**Frontend - `web/src/services/ApiService.ts`:**
- تحديث `register()`: يستقبل `fullName`, `email`, `password`, `accountType`, `tenantId`, `role`
- إضافة `restoreToken()` لاستعادة التوكن من localStorage

### الملفات المتأثرة
- `src/TaqTask.Api/Controllers/AuthController.cs`
- `src/TaqTask.Api/Controllers/TenantController.cs`
- `web/src/App.tsx`
- `web/src/pages/TenantRegister.tsx`
- `web/src/services/ApiService.ts`

---

## 2. إصلاح الترميز العربي (UTF-8 / MySQL Charset)

### المشكلة
الأحرف العربية تظهر كعلامات استفهام `?????` عند حفظها في قاعدة البيانات أو استعراضها من API.

### السبب
MySQL client connection كان يستخدم `latin1` charset بينما قاعدة البيانات تستخدم `utf8mb4`.

### التغييرات

**Backend - `src/TaqTask.Api/Program.cs`:**
- استخدام `MySqlConnectionStringBuilder.CharacterSet = "utf8mb4"` لضبط ترميز الاتصال

**Docker - `docker-compose.yml`:**
- إضافة `Charset=utf8mb4` إلى connection string

**قاعدة البيانات:**
- تحديث اسم المدير مباشرة: `UPDATE users SET full_name = 'فيصل الغامدي' WHERE email = 'admin@todoos.com'`

### الملفات المتأثرة
- `src/TaqTask.Api/Program.cs`
- `docker-compose.yml`

---

## 3. تحديث الملف الشخصي عبر API

### المشكلة
تعديل الاسم من الواجهة كان يحفظ فقط في `localStorage` ولا يحدث قاعدة البيانات، فعند تسجيل الخروج والدخول يرجع الاسم القديم.

### التغييرات

**Backend - `src/TaqTask.Api/Controllers/AuthController.cs`:**
- إضافة endpoint جديد: `PUT /api/auth/profile`
- يقبل `{ fullName?, email? }` ويحدث المستخدم في قاعدة البيانات
- يتحقق من عدم تكرار البريد الإلكتروني

**Frontend - `web/src/App.tsx`:**
- `handleUpdateUser`: بعد التعديل محلياً، يرسل التغييرات للـ API عبر `apiService.updateProfile()`

**Frontend - `web/src/services/ApiService.ts`:**
- إضافة `updateProfile(data: { fullName?, email? })`

### الملفات المتأثرة
- `src/TaqTask.Api/Controllers/AuthController.cs`
- `web/src/App.tsx`
- `web/src/services/ApiService.ts`

---

## 4. إصلاح تسجيل الدخول (Login Flow)

### المشكلة
بعد تسجيل مستخدم جديد، كان الدخول بحساب الادمن يعطي "بيانات الدخول غير صحيحة".

### التغييرات

**Frontend - `web/src/App.tsx`:**
- `handleLogin`: الآن يحاول API أولاً (باستخدام `apiService.login`)، وإذا فشل يرجع للـ `localStorage`
- `handleRegister`: كلمة المرور لا تُخزن محلياً (`password: ''`)
- `handleAddUser`: بعد إنشاء المستخدم عبر API، يتم استعادة توكن المدير الأصلي

### الملفات المتأثرة
- `web/src/App.tsx`

---

## 5. إضافة مستخدمين عبر API (فريق العمل)

### المشكلة
إضافة مستخدم من صفحة Team كان يحفظ فقط في `localStorage` ولا يظهر في لوحة تحكم المشرف العام.

### التغييرات

**Frontend - `web/src/App.tsx`:**
- `handleAddUser`: بعد إضافة المستخدم محلياً، ينشئه أيضاً عبر API (`apiService.register` مع `tenantId`)
- استخدام `restoreToken()` للحفاظ على توكن المدير

### الملفات المتأثرة
- `web/src/App.tsx`

---

## جميع الملفات المعدلة

| الملف | التغيير |
|-------|---------|
| `src/TaqTask.Api/Controllers/AuthController.cs` | إنشاء مؤسسة تلقائي، إضافة `PUT /api/auth/profile`، إضافة `AccountType`/`Role` |
| `src/TaqTask.Api/Controllers/TenantController.cs` | إضافة `using System.Security.Cryptography` و `System.Text` |
| `src/TaqTask.Api/Program.cs` | ضبط charset utf8mb4 عبر `MySqlConnectionStringBuilder` |
| `docker-compose.yml` | إضافة `Charset=utf8mb4` |
| `web/src/App.tsx` | `handleLogin` (API أولاً)، `handleRegister` (API)، `handleUpdateUser` (API)، `handleAddUser` (API) |
| `web/src/pages/TenantRegister.tsx` | إضافة `fullName`, `password`، إنشاء المستخدم بعد المؤسسة |
| `web/src/services/ApiService.ts` | تحديث `register()`، إضافة `updateProfile()`، إضافة `restoreToken()` |

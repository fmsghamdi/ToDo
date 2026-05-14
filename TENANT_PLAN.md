# 📋 خطة تحويل ToDoOS إلى SaaS Multi-Tenant

## 1. 🏢 جدول Tenants (جديد)

| الحقل | النوع | الوصف |
|-------|------|-------|
| Id | GUID | معرف فريد |
| Name | string | اسم الجهة (شركة/مدرسة/مؤسسة) |
| Subdomain | string (unique) | دومين فرعي مثلاً company1.todoos.com |
| Email | string | إيميل الجهة |
| LogoUrl | string? | رابط الشعار (يرفع على S3) |
| PrimaryColor | string? | اللون الأساسي (#hex) |
| SecondaryColor | string? | اللون الثانوي (#hex) |
| CompanyAddress | string? | العنوان |
| CompanyPhone | string? | رقم الهاتف |
| CompanyWebsite | string? | الموقع الإلكتروني |
| IsActive | boolean | تفعيل الحساب |
| SubscriptionPlan | string | الخطة (free/pro/enterprise) |
| MaxUsers | int | الحد الأقصى للمستخدمين |
| MaxBoards | int | الحد الأقصى للوحات |
| Features | JSON | الميزات المسموحة |
| CreatedAt | DateTime | تاريخ التسجيل |
| UpdatedAt | DateTime | آخر تحديث |

## 2. 🔄 التعديل على الجداول الموجودة

كل الجداول الحالية سيُضاف إليها `TenantId` كـ **مفتاح أجنبي**:

- users ➕ TenantId
- boards ➕ TenantId
- board_columns ➕ TenantId
- cards ➕ TenantId
- board_members ➕ TenantId
- card_members ➕ TenantId
- comments ➕ TenantId
- attachments ➕ TenantId
- activities ➕ TenantId
- time_entries ➕ TenantId
- notifications ➕ TenantId
- recurring_tasks ➕ TenantId

## 3. 🔐 JWT Token

سيتم إضافة `TenantId` و `TenantName` إلى التوكن:

```json
{
  "sub": "user-id",
  "tenantId": "tenant-id",
  "tenantName": "شركة الأمل",
  "role": "admin",
  "exp": "..."
}
```

## 4. 🎨 الـ Branding Flow

لما المستخدم يسجل دخول:
1. توكن JWT يرجع مع `TenantId`
2. الفرونت إند يطلب `GET /api/tenants/{id}/branding`
3. يرجع: logo, primaryColor, secondaryColor, name
4. الصفحة تتغير ألوانها وشعارها حسب الجهة

## 5. 🛡️ العزل (Data Isolation)

كل API كول ينفذ: `WHERE TenantId = @TenantId`
ما يحتاج العميل يرسل `TenantId` لأنه موجود في التوكن (السيرفر يقرأه من JWT)

## 6. 🖥️ الصفحات الجديدة المطلوبة

- **/register-tenant** - تسجيل جهة جديدة (اسم، إيميل، كلمة سر)
- **/tenant-settings** - تعديل بيانات الجهة + رفع شعار + ألوان (للمسؤول فقط)
- **/invite-users** - دعوة مستخدمين جدد للجهة

## 7. 🚀 الجدول الزمني التقريبي

| المرحلة | المدة |
|---------|-------|
| 1. إنشاء جدول Tenants + التعديل على Models | 1 ساعة |
| 2. إضافة TenantId لكل الجداول والعلاقات | 1 ساعة |
| 3. Tenant Registration API + Branding API | 2 ساعات |
| 4. Tenant Middleware + تعديل JWT | 1 ساعة |
| 5. تعديل كل الـ Controllers لتصفية البيانات | 2 ساعات |
| 6. تعديل DbContext بـ Global Query Filters | 1 ساعة |
| 7. إضافة global usings لـ TenantId | 30 دقيقة |
| 8. الفرونت إند (تسجيل + إعدادات + branding) | 2 ساعات |
| 9. اختبار + ربط جميع الأجزاء | 1 ساعة |
| **المجموع** | **~11 ساعة** |

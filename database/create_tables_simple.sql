-- ToDoOS Database Schema - Simple Version
-- إنشاء جداول نظام إدارة المشاريع (نسخة مبسطة)

USE ToDoOS;

-- حذف الجداول الموجودة
DROP TABLE IF EXISTS recurring_tasks;
DROP TABLE IF EXISTS database_configs;
DROP TABLE IF EXISTS email_configs;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS time_entries;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS board_members;
DROP TABLE IF EXISTS card_members;
DROP TABLE IF EXISTS cards;
DROP TABLE IF EXISTS board_columns;
DROP TABLE IF EXISTS columns;
DROP TABLE IF EXISTS boards;
DROP TABLE IF EXISTS users;

PRINT N'تم حذف الجداول الموجودة...';

-- جدول المستخدمين
CREATE TABLE users (
    id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) UNIQUE NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    avatar NVARCHAR(255),
    role NVARCHAR(20) DEFAULT 'user',
    is_active BIT DEFAULT 1,
    is_ad_user BIT DEFAULT 0,
    ad_username NVARCHAR(100),
    department NVARCHAR(100),
    job_title NVARCHAR(100),
    phone NVARCHAR(20),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    last_login DATETIME2
);

PRINT N'تم إنشاء جدول المستخدمين...';

-- جدول اللوحات
CREATE TABLE boards (
    id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    color NVARCHAR(7) DEFAULT '#3B82F6',
    owner_id INT NOT NULL,
    is_public BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

PRINT N'تم إنشاء جدول اللوحات...';

-- جدول الأعمدة
CREATE TABLE board_columns (
    id INT PRIMARY KEY IDENTITY(1,1),
    board_id INT NOT NULL,
    title NVARCHAR(100) NOT NULL,
    position INT NOT NULL,
    color NVARCHAR(7) DEFAULT '#6B7280',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

PRINT N'تم إنشاء جدول الأعمدة...';

-- جدول البطاقات/المهام
CREATE TABLE cards (
    id INT PRIMARY KEY IDENTITY(1,1),
    column_id INT NOT NULL,
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    priority NVARCHAR(10) DEFAULT 'Medium',
    due_date DATETIME2,
    start_date DATETIME2,
    position INT NOT NULL,
    color NVARCHAR(7),
    tags NVARCHAR(500),
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2) DEFAULT 0,
    created_by INT NOT NULL,
    assigned_to INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

PRINT N'تم إنشاء جدول البطاقات...';

-- جدول أعضاء البطاقات
CREATE TABLE card_members (
    id INT PRIMARY KEY IDENTITY(1,1),
    card_id INT NOT NULL,
    user_id INT NOT NULL,
    added_at DATETIME2 DEFAULT GETDATE()
);

-- جدول أعضاء اللوحات
CREATE TABLE board_members (
    id INT PRIMARY KEY IDENTITY(1,1),
    board_id INT NOT NULL,
    user_id INT NOT NULL,
    role NVARCHAR(20) DEFAULT 'member',
    added_at DATETIME2 DEFAULT GETDATE()
);

-- جدول الأنشطة
CREATE TABLE activities (
    id INT PRIMARY KEY IDENTITY(1,1),
    card_id INT,
    board_id INT,
    user_id INT NOT NULL,
    type NVARCHAR(50) NOT NULL,
    message NVARCHAR(500) NOT NULL,
    old_value NVARCHAR(MAX),
    new_value NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- جدول تسجيل الوقت
CREATE TABLE time_entries (
    id INT PRIMARY KEY IDENTITY(1,1),
    card_id INT NOT NULL,
    user_id INT NOT NULL,
    duration INT NOT NULL,
    description NVARCHAR(500),
    start_time DATETIME2,
    end_time DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- جدول المرفقات
CREATE TABLE attachments (
    id INT PRIMARY KEY IDENTITY(1,1),
    card_id INT NOT NULL,
    filename NVARCHAR(255) NOT NULL,
    original_name NVARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type NVARCHAR(100),
    file_path NVARCHAR(500) NOT NULL,
    uploaded_by INT NOT NULL,
    uploaded_at DATETIME2 DEFAULT GETDATE()
);

-- جدول التعليقات
CREATE TABLE comments (
    id INT PRIMARY KEY IDENTITY(1,1),
    card_id INT NOT NULL,
    user_id INT NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- جدول الإشعارات
CREATE TABLE notifications (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    title NVARCHAR(200) NOT NULL,
    message NVARCHAR(500) NOT NULL,
    type NVARCHAR(50) NOT NULL,
    is_read BIT DEFAULT 0,
    related_card_id INT,
    related_board_id INT,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- جدول إعدادات النظام
CREATE TABLE system_settings (
    id INT PRIMARY KEY IDENTITY(1,1),
    setting_key NVARCHAR(100) UNIQUE NOT NULL,
    setting_value NVARCHAR(MAX),
    description NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- جدول إعدادات البريد الإلكتروني
CREATE TABLE email_configs (
    id INT PRIMARY KEY IDENTITY(1,1),
    enabled BIT DEFAULT 0,
    provider NVARCHAR(50) DEFAULT 'exchange',
    server NVARCHAR(200),
    port NVARCHAR(10),
    username NVARCHAR(200),
    password NVARCHAR(500),
    use_ssl BIT DEFAULT 1,
    use_tls BIT DEFAULT 0,
    task_email_address NVARCHAR(200),
    auto_create_tasks BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- جدول إعدادات قاعدة البيانات
CREATE TABLE database_configs (
    id INT PRIMARY KEY IDENTITY(1,1),
    config_type NVARCHAR(50) NOT NULL,
    host NVARCHAR(200),
    port NVARCHAR(10),
    database_name NVARCHAR(100),
    username NVARCHAR(200),
    password NVARCHAR(500),
    connection_string NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- جدول المهام المتكررة
CREATE TABLE recurring_tasks (
    id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    board_id INT NOT NULL,
    column_id INT NOT NULL,
    assigned_to INT,
    priority NVARCHAR(10) DEFAULT 'Medium',
    recurrence_type NVARCHAR(20) NOT NULL,
    recurrence_interval INT DEFAULT 1,
    recurrence_days NVARCHAR(20),
    start_date DATETIME2 NOT NULL,
    end_date DATETIME2,
    last_created DATETIME2,
    is_active BIT DEFAULT 1,
    created_by INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);

PRINT N'تم إنشاء جميع الجداول...';

-- إدراج بيانات أولية
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('organization_name', 'ToDoOS', N'اسم المؤسسة'),
('system_url', 'http://localhost:3000', N'رابط النظام'),
('default_language', 'ar', N'اللغة الافتراضية'),
('timezone', 'Asia/Riyadh', N'المنطقة الزمنية'),
('date_format', 'DD/MM/YYYY', N'تنسيق التاريخ'),
('allow_self_registration', '1', N'السماح بالتسجيل الذاتي'),
('require_email_verification', '0', N'طلب تأكيد البريد الإلكتروني'),
('session_timeout', '480', N'انتهاء الجلسة بالدقائق');

PRINT N'تم إدراج إعدادات النظام...';

-- إنشاء مستخدم إداري افتراضي
INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES
('admin', 'admin@todoos.com', '$2b$10$rQZ9QmjlZKZvKJ9QmjlZKO', N'مدير النظام', 'admin', 1);

PRINT N'تم إنشاء المستخدم الإداري...';

-- إنشاء لوحة تجريبية
INSERT INTO boards (title, description, owner_id) VALUES
(N'مشروع تجريبي', N'لوحة تجريبية لاختبار النظام', 1);

PRINT N'تم إنشاء اللوحة التجريبية...';

-- إنشاء أعمدة افتراضية
INSERT INTO board_columns (board_id, title, position) VALUES
(1, N'قائمة المهام', 1),
(1, N'قيد التنفيذ', 2),
(1, N'مكتمل', 3);

PRINT N'تم إنشاء الأعمدة الافتراضية...';

-- إنشاء مهمة تجريبية
INSERT INTO cards (column_id, title, description, created_by, position) VALUES
(1, N'مهمة تجريبية', N'هذه مهمة تجريبية لاختبار النظام', 1, 1);

PRINT N'تم إنشاء المهمة التجريبية...';

PRINT N'🎉 تم إنشاء جميع الجداول والبيانات الأولية بنجاح!';
PRINT N'📊 تم إنشاء 15 جدول مع البيانات الأولية';
PRINT N'👤 المستخدم الإداري: admin / admin@todoos.com';
PRINT N'🔑 كلمة المرور: admin123 (يرجى تغييرها فوراً)';

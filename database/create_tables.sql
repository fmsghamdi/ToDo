-- ToDoOS Database Schema
-- إنشاء جداول نظام إدارة المشاريع

USE ToDoOS;

-- جدول المستخدمين
CREATE TABLE users (
    id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) UNIQUE NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    avatar NVARCHAR(255),
    role NVARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
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

-- جدول اللوحات
CREATE TABLE boards (
    id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    color NVARCHAR(7) DEFAULT '#3B82F6',
    owner_id INT NOT NULL,
    is_public BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- جدول الأعمدة
CREATE TABLE columns (
    id INT PRIMARY KEY IDENTITY(1,1),
    board_id INT NOT NULL,
    title NVARCHAR(100) NOT NULL,
    position INT NOT NULL,
    color NVARCHAR(7) DEFAULT '#6B7280',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- جدول البطاقات/المهام
CREATE TABLE cards (
    id INT PRIMARY KEY IDENTITY(1,1),
    column_id INT NOT NULL,
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    priority NVARCHAR(10) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    due_date DATETIME2,
    start_date DATETIME2,
    position INT NOT NULL,
    color NVARCHAR(7),
    tags NVARCHAR(500), -- JSON array of tags
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2) DEFAULT 0,
    created_by INT NOT NULL,
    assigned_to INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- جدول أعضاء البطاقات
CREATE TABLE card_members (
    id INT PRIMARY KEY IDENTITY(1,1),
    card_id INT NOT NULL,
    user_id INT NOT NULL,
    added_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(card_id, user_id)
);

-- جدول أعضاء اللوحات
CREATE TABLE board_members (
    id INT PRIMARY KEY IDENTITY(1,1),
    board_id INT NOT NULL,
    user_id INT NOT NULL,
    role NVARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    added_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(board_id, user_id)
);

-- جدول الأنشطة
CREATE TABLE activities (
    id INT PRIMARY KEY IDENTITY(1,1),
    card_id INT,
    board_id INT,
    user_id INT NOT NULL,
    type NVARCHAR(50) NOT NULL, -- 'created', 'moved', 'updated', 'commented', etc.
    message NVARCHAR(500) NOT NULL,
    old_value NVARCHAR(MAX),
    new_value NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- جدول تسجيل الوقت
CREATE TABLE time_entries (
    id INT PRIMARY KEY IDENTITY(1,1),
    card_id INT NOT NULL,
    user_id INT NOT NULL,
    duration INT NOT NULL, -- in minutes
    description NVARCHAR(500),
    start_time DATETIME2,
    end_time DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
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
    uploaded_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- جدول التعليقات
CREATE TABLE comments (
    id INT PRIMARY KEY IDENTITY(1,1),
    card_id INT NOT NULL,
    user_id INT NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- جدول الإشعارات
CREATE TABLE notifications (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    title NVARCHAR(200) NOT NULL,
    message NVARCHAR(500) NOT NULL,
    type NVARCHAR(50) NOT NULL, -- 'task_assigned', 'due_date', 'comment', etc.
    is_read BIT DEFAULT 0,
    related_card_id INT,
    related_board_id INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_card_id) REFERENCES cards(id) ON DELETE SET NULL,
    FOREIGN KEY (related_board_id) REFERENCES boards(id) ON DELETE SET NULL
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
    password NVARCHAR(500), -- encrypted
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
    password NVARCHAR(500), -- encrypted
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
    recurrence_type NVARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    recurrence_interval INT DEFAULT 1,
    recurrence_days NVARCHAR(20), -- for weekly: 'mon,wed,fri'
    start_date DATETIME2 NOT NULL,
    end_date DATETIME2,
    last_created DATETIME2,
    is_active BIT DEFAULT 1,
    created_by INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (column_id) REFERENCES columns(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- إدراج بيانات أولية
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('organization_name', 'ToDoOS', 'اسم المؤسسة'),
('system_url', 'http://localhost:3000', 'رابط النظام'),
('default_language', 'ar', 'اللغة الافتراضية'),
('timezone', 'Asia/Riyadh', 'المنطقة الزمنية'),
('date_format', 'DD/MM/YYYY', 'تنسيق التاريخ'),
('allow_self_registration', '1', 'السماح بالتسجيل الذاتي'),
('require_email_verification', '0', 'طلب تأكيد البريد الإلكتروني'),
('session_timeout', '480', 'انتهاء الجلسة بالدقائق');

-- إنشاء مستخدم إداري افتراضي
INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES
('admin', 'admin@todoos.com', '$2b$10$rQZ9QmjlZKZvKJ9QmjlZKO', 'مدير النظام', 'admin', 1);

-- إنشاء لوحة تجريبية
INSERT INTO boards (title, description, owner_id) VALUES
('مشروع تجريبي', 'لوحة تجريبية لاختبار النظام', 1);

-- إنشاء أعمدة افتراضية
INSERT INTO columns (board_id, title, position) VALUES
(1, 'قائمة المهام', 1),
(1, 'قيد التنفيذ', 2),
(1, 'مكتمل', 3);

-- إنشاء مهمة تجريبية
INSERT INTO cards (column_id, title, description, created_by, position) VALUES
(1, 'مهمة تجريبية', 'هذه مهمة تجريبية لاختبار النظام', 1, 1);

PRINT 'تم إنشاء جميع الجداول والبيانات الأولية بنجاح!';

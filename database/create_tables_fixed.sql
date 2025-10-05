-- ToDoOS Database Schema - Fixed Version
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
    role NVARCHAR(20) DEFAULT 'user',
    is_active BIT DEFAULT 1,
    is_ad_user BIT DEFAULT 0,
    ad_username NVARCHAR(100),
    department NVARCHAR(100),
    job_title NVARCHAR(100),
    phone NVARCHAR(20),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    last_login DATETIME2,
    CONSTRAINT CK_users_role CHECK (role IN ('admin', 'manager', 'user'))
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
    CONSTRAINT FK_boards_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- جدول الأعمدة
CREATE TABLE board_columns (
    id INT PRIMARY KEY IDENTITY(1,1),
    board_id INT NOT NULL,
    title NVARCHAR(100) NOT NULL,
    position INT NOT NULL,
    color NVARCHAR(7) DEFAULT '#6B7280',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_columns_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

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
    tags NVARCHAR(500), -- JSON array of tags
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2) DEFAULT 0,
    created_by INT NOT NULL,
    assigned_to INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_cards_column FOREIGN KEY (column_id) REFERENCES board_columns(id) ON DELETE CASCADE,
    CONSTRAINT FK_cards_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT FK_cards_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id),
    CONSTRAINT CK_cards_priority CHECK (priority IN ('Low', 'Medium', 'High'))
);

-- جدول أعضاء البطاقات
CREATE TABLE card_members (
    id INT PRIMARY KEY IDENTITY(1,1),
    card_id INT NOT NULL,
    user_id INT NOT NULL,
    added_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_card_members_card FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    CONSTRAINT FK_card_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT UK_card_member UNIQUE(card_id, user_id)
);

-- جدول أعضاء اللوحات
CREATE TABLE board_members (
    id INT PRIMARY KEY IDENTITY(1,1),
    board_id INT NOT NULL,
    user_id INT NOT NULL,
    role NVARCHAR(20) DEFAULT 'member',
    added_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_board_members_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    CONSTRAINT FK_board_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT UK_board_member UNIQUE(board_id, user_id),
    CONSTRAINT CK_board_members_role CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
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
    CONSTRAINT FK_activities_card FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    CONSTRAINT FK_activities_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    CONSTRAINT FK_activities_user FOREIGN KEY (user_id) REFERENCES users(id)
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
    CONSTRAINT FK_time_entries_card FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    CONSTRAINT FK_time_entries_user FOREIGN KEY (user_id) REFERENCES users(id)
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
    CONSTRAINT FK_attachments_card FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    CONSTRAINT FK_attachments_user FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- جدول التعليقات
CREATE TABLE comments (
    id INT PRIMARY KEY IDENTITY(1,1),
    card_id INT NOT NULL,
    user_id INT NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_comments_card FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    CONSTRAINT FK_comments_user FOREIGN KEY (user_id) REFERENCES users(id)
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
    CONSTRAINT FK_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT FK_notifications_card FOREIGN KEY (related_card_id) REFERENCES cards(id) ON DELETE SET NULL,
    CONSTRAINT FK_notifications_board FOREIGN KEY (related_board_id) REFERENCES boards(id) ON DELETE SET NULL
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
    CONSTRAINT FK_recurring_tasks_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    CONSTRAINT FK_recurring_tasks_column FOREIGN KEY (column_id) REFERENCES board_columns(id),
    CONSTRAINT FK_recurring_tasks_assigned FOREIGN KEY (assigned_to) REFERENCES users(id),
    CONSTRAINT FK_recurring_tasks_created FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT CK_recurring_tasks_priority CHECK (priority IN ('Low', 'Medium', 'High')),
    CONSTRAINT CK_recurring_tasks_type CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly'))
);

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

-- إنشاء مستخدم إداري افتراضي
INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES
('admin', 'admin@todoos.com', '$2b$10$rQZ9QmjlZKZvKJ9QmjlZKO', N'مدير النظام', 'admin', 1);

-- إنشاء لوحة تجريبية
INSERT INTO boards (title, description, owner_id) VALUES
(N'مشروع تجريبي', N'لوحة تجريبية لاختبار النظام', 1);

-- إنشاء أعمدة افتراضية
INSERT INTO board_columns (board_id, title, position) VALUES
(1, N'قائمة المهام', 1),
(1, N'قيد التنفيذ', 2),
(1, N'مكتمل', 3);

-- إنشاء مهمة تجريبية
INSERT INTO cards (column_id, title, description, created_by, position) VALUES
(1, N'مهمة تجريبية', N'هذه مهمة تجريبية لاختبار النظام', 1, 1);

PRINT N'تم إنشاء جميع الجداول والبيانات الأولية بنجاح!';

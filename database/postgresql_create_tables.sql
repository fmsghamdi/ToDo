-- ToDoOS Database Schema for PostgreSQL
-- إنشاء جداول نظام إدارة المشاريع

-- الاتصال بقاعدة البيانات
\c todoos;

-- إنشاء أنواع البيانات المخصصة
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE priority_level AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE board_member_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE recurrence_type AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- جدول المستخدمين
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255),
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    is_ad_user BOOLEAN DEFAULT FALSE,
    ad_username VARCHAR(100),
    department VARCHAR(100),
    job_title VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- جدول اللوحات
CREATE TABLE boards (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    owner_id INTEGER NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- جدول الأعمدة
CREATE TABLE columns (
    id SERIAL PRIMARY KEY,
    board_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- جدول البطاقات/المهام
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    column_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority priority_level DEFAULT 'Medium',
    due_date TIMESTAMP,
    start_date TIMESTAMP,
    position INTEGER NOT NULL,
    color VARCHAR(7),
    tags JSONB,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2) DEFAULT 0,
    created_by INTEGER NOT NULL,
    assigned_to INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- جدول أعضاء البطاقات
CREATE TABLE card_members (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(card_id, user_id)
);

-- جدول أعضاء اللوحات
CREATE TABLE board_members (
    id SERIAL PRIMARY KEY,
    board_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role board_member_role DEFAULT 'member',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(board_id, user_id)
);

-- جدول الأنشطة
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    card_id INTEGER,
    board_id INTEGER,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    message VARCHAR(500) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- جدول تسجيل الوقت
CREATE TABLE time_entries (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    description VARCHAR(500),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- جدول المرفقات
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INTEGER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- جدول التعليقات
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- جدول الإشعارات
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_card_id INTEGER,
    related_board_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_card_id) REFERENCES cards(id) ON DELETE SET NULL,
    FOREIGN KEY (related_board_id) REFERENCES boards(id) ON DELETE SET NULL
);

-- جدول إعدادات النظام
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول إعدادات البريد الإلكتروني
CREATE TABLE email_configs (
    id SERIAL PRIMARY KEY,
    enabled BOOLEAN DEFAULT FALSE,
    provider VARCHAR(50) DEFAULT 'exchange',
    server VARCHAR(200),
    port VARCHAR(10),
    username VARCHAR(200),
    password VARCHAR(500), -- encrypted
    use_ssl BOOLEAN DEFAULT TRUE,
    use_tls BOOLEAN DEFAULT FALSE,
    task_email_address VARCHAR(200),
    auto_create_tasks BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول إعدادات قاعدة البيانات
CREATE TABLE database_configs (
    id SERIAL PRIMARY KEY,
    config_type VARCHAR(50) NOT NULL,
    host VARCHAR(200),
    port VARCHAR(10),
    database_name VARCHAR(100),
    username VARCHAR(200),
    password VARCHAR(500), -- encrypted
    connection_string TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول المهام المتكررة
CREATE TABLE recurring_tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    board_id INTEGER NOT NULL,
    column_id INTEGER NOT NULL,
    assigned_to INTEGER,
    priority priority_level DEFAULT 'Medium',
    recurrence_type recurrence_type NOT NULL,
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_days VARCHAR(20), -- for weekly: mon,wed,fri
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    last_created TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (column_id) REFERENCES columns(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- إنشاء الفهارس للأداء
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_boards_owner ON boards(owner_id);
CREATE INDEX idx_columns_board ON columns(board_id);
CREATE INDEX idx_cards_column ON cards(column_id);
CREATE INDEX idx_cards_created_by ON cards(created_by);
CREATE INDEX idx_cards_assigned_to ON cards(assigned_to);
CREATE INDEX idx_activities_card ON activities(card_id);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_time_entries_card ON time_entries(card_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- إنشاء دوال التحديث التلقائي للوقت
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء المحفزات للتحديث التلقائي
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_columns_updated_at BEFORE UPDATE ON columns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_configs_updated_at BEFORE UPDATE ON email_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_database_configs_updated_at BEFORE UPDATE ON database_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
('admin', 'admin@todoos.com', '$2b$10$rQZ9QmjlZKZvKJ9QmjlZKO', 'مدير النظام', 'admin', TRUE);

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

SELECT 'تم إنشاء جميع الجداول والبيانات الأولية بنجاح!' as result;

# دليل تركيب ToDoOS مع MySQL على Ubuntu

## المتطلبات
- Ubuntu 20.04 LTS أو أحدث
- .NET 9.0 SDK
- MySQL 8.0 أو أحدث
- Node.js 18+ و npm

## الخطوة 1: تثبيت MySQL

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت MySQL Server
sudo apt install mysql-server -y

# تشغيل MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# تأمين MySQL
sudo mysql_secure_installation
```

عند تشغيل `mysql_secure_installation`:
- اختر كلمة مرور قوية لـ root
- أجب بـ Yes على جميع الأسئلة

## الخطوة 2: إعداد قاعدة البيانات

```bash
# الدخول إلى MySQL
sudo mysql -u root -p

# داخل MySQL shell
CREATE DATABASE ToDoOS CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# إنشاء مستخدم خاص بالمشروع
CREATE USER 'todoos_user'@'localhost' IDENTIFIED BY 'your_secure_password';

# منح الصلاحيات
GRANT ALL PRIVILEGES ON ToDoOS.* TO 'todoos_user'@'localhost';
FLUSH PRIVILEGES;

# الخروج
EXIT;
```

## الخطوة 3: استيراد جداول قاعدة البيانات

```bash
# الانتقال إلى مجلد المشروع
cd /path/to/ToDoOS

# استيراد الجداول
mysql -u todoos_user -p ToDoOS < database/mysql_create_tables.sql
```

## الخطوة 4: تثبيت .NET 9.0 SDK

```bash
# إضافة مستودع Microsoft
wget https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# تثبيت .NET SDK
sudo apt update
sudo apt install -y dotnet-sdk-9.0

# التحقق من التثبيت
dotnet --version
```

## الخطوة 5: تثبيت Node.js و npm

```bash
# تثبيت Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# التحقق من التثبيت
node --version
npm --version
```

## الخطوة 6: إعداد المشروع

### Backend (API)

```bash
cd src/TaqTask.Api

# تحديث ملف appsettings.json
nano appsettings.json
```

عدّل سطر الاتصال بقاعدة البيانات:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=ToDoOS;User=todoos_user;Password=your_secure_password;"
  },
  "Database": {
    "Provider": "MySQL"
  }
}
```

```bash
# استعادة المكتبات
dotnet restore

# بناء المشروع
dotnet build

# تشغيل المشروع
dotnet run
```

API سيعمل على: `http://localhost:5000`

### Frontend (React)

```bash
cd ../../web

# تثبيت المكتبات
npm install

# تشغيل المشروع
npm run dev
```

Frontend سيعمل على: `http://localhost:5173`

## الخطوة 7: إعداد Systemd Service (اختياري)

### إنشاء خدمة للـ API

```bash
sudo nano /etc/systemd/system/todoos-api.service
```

محتوى الملف:
```ini
[Unit]
Description=ToDoOS API Service
After=network.target mysql.service

[Service]
Type=notify
WorkingDirectory=/path/to/ToDoOS/src/TaqTask.Api
ExecStart=/usr/bin/dotnet run --urls "http://0.0.0.0:5000"
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=todoos-api
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

[Install]
WantedBy=multi-user.target
```

```bash
# تفعيل الخدمة
sudo systemctl daemon-reload
sudo systemctl enable todoos-api
sudo systemctl start todoos-api

# التحقق من الحالة
sudo systemctl status todoos-api
```

### إنشاء خدمة للـ Frontend (باستخدام nginx)

```bash
# تثبيت nginx
sudo apt install nginx -y

# بناء المشروع للإنتاج
cd /path/to/ToDoOS/web
npm run build

# نسخ الملفات المبنية
sudo mkdir -p /var/www/todoos
sudo cp -r dist/* /var/www/todoos/

# إعداد nginx
sudo nano /etc/nginx/sites-available/todoos
```

محتوى إعداد nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/todoos;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/todoos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## الخطوة 8: إعداد SSL (اختياري لكن موصى به)

```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx -y

# الحصول على شهادة SSL
sudo certbot --nginx -d your-domain.com

# التجديد التلقائي
sudo systemctl status certbot.timer
```

## الخطوة 9: إعداد Firewall

```bash
# السماح بالمنافذ الضرورية
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3306/tcp  # MySQL (فقط إذا كنت تريد الوصول الخارجي)

# تفعيل Firewall
sudo ufw enable
```

## الخطوة 10: النسخ الاحتياطي التلقائي

إنشاء سكريبت للنسخ الاحتياطي:

```bash
sudo nano /usr/local/bin/backup-todoos.sh
```

محتوى السكريبت:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/todoos"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# نسخ احتياطي لقاعدة البيانات
mysqldump -u todoos_user -pyour_secure_password ToDoOS | gzip > "$BACKUP_DIR/todoos_db_$TIMESTAMP.sql.gz"

# حذف النسخ الاحتياطية الأقدم من 30 يوم
find $BACKUP_DIR -name "todoos_db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: todoos_db_$TIMESTAMP.sql.gz"
```

```bash
# جعل السكريبت قابل للتنفيذ
sudo chmod +x /usr/local/bin/backup-todoos.sh

# إضافة مهمة cron للنسخ الاحتياطي اليومي
sudo crontab -e
```

أضف السطر التالي:
```
0 2 * * * /usr/local/bin/backup-todoos.sh
```

## استكشاف الأخطاء

### مشكلة: خطأ في الاتصال بقاعدة البيانات
```
Unable to connect to MySQL server
```
**الحل:**
```bash
# التحقق من تشغيل MySQL
sudo systemctl status mysql

# إذا كان متوقفاً، قم بتشغيله
sudo systemctl start mysql

# التحقق من كلمة المرور والمستخدم
mysql -u todoos_user -p ToDoOS
```

### مشكلة: خطأ في المكتبات
```
error: Package restore failed
```
**الحل:**
```bash
# حذف مجلدات cache
rm -rf ~/.nuget/packages
cd src/TaqTask.Api
dotnet clean
dotnet restore
```

### مشكلة: المنفذ 5000 مستخدم
```
Address already in use
```
**الحل:**
```bash
# إيجاد العملية التي تستخدم المنفذ
sudo lsof -i :5000

# إنهاء العملية
sudo kill -9 <PID>
```

### مشكلة: خطأ في صلاحيات الملفات
```
Permission denied
```
**الحل:**
```bash
# تعديل صلاحيات المجلد
sudo chown -R $USER:$USER /path/to/ToDoOS
chmod -R 755 /path/to/ToDoOS
```

## الصيانة الدورية

### تحديث المشروع
```bash
cd /path/to/ToDoOS
git pull origin main

# تحديث Backend
cd src/TaqTask.Api
dotnet restore
dotnet build
sudo systemctl restart todoos-api

# تحديث Frontend
cd ../../web
npm install
npm run build
sudo cp -r dist/* /var/www/todoos/
```

### مراقبة الأداء
```bash
# مراقبة استخدام الموارد
htop

# مراقبة logs الـ API
sudo journalctl -u todoos-api -f

# مراقبة logs MySQL
sudo tail -f /var/log/mysql/error.log

# مراقبة logs nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### تحسين أداء MySQL
```bash
# الدخول إلى MySQL
sudo mysql -u root -p

# تحسين الجداول
USE ToDoOS;
OPTIMIZE TABLE users, boards, cards, columns;

# تحليل الأداء
SHOW PROCESSLIST;
SHOW STATUS;
```

## الأمان

### حماية MySQL
```bash
# عدم السماح بالوصول الخارجي
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```
تأكد من وجود:
```
bind-address = 127.0.0.1
```

### تحديثات الأمان
```bash
# تحديث النظام بانتظام
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
```

### مراقبة الأمان
```bash
# تثبيت fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## الدعم والمساعدة

- **الموقع الرسمي:** https://github.com/fmsghamdi/ToDo
- **التوثيق:** راجع ملفات README.md في المشروع
- **المشاكل:** أنشئ Issue على GitHub

## ملاحظات مهمة

1. **كلمات المرور**: غيّر جميع كلمات المرور الافتراضية
2. **النسخ الاحتياطي**: تأكد من عمل نسخ احتياطية دورية
3. **التحديثات**: حافظ على تحديث النظام والمكتبات
4. **المراقبة**: راقب السجلات (logs) بانتظام
5. **الأمان**: استخدم HTTPS في الإنتاج
6. **الأداء**: راقب استخدام الموارد وقم بالتحسين عند الحاجة

## مثال على إعداد كامل سريع

```bash
#!/bin/bash
# سكريبت تثبيت سريع (للاختبار فقط)

# تثبيت المتطلبات
sudo apt update
sudo apt install -y mysql-server dotnet-sdk-9.0 nginx

# إعداد قاعدة البيانات
sudo mysql -e "CREATE DATABASE ToDoOS CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'todoos'@'localhost' IDENTIFIED BY 'TodoosPass123!';"
sudo mysql -e "GRANT ALL ON ToDoOS.* TO 'todoos'@'localhost';"

# استيراد الجداول
mysql -u todoos -pTodosPass123! ToDoOS < database/mysql_create_tables.sql

# بناء وتشغيل Backend
cd src/TaqTask.Api
dotnet restore
dotnet run &

# تشغيل Frontend
cd ../../web
npm install
npm run dev

echo "ToDoOS is ready at http://localhost:5173"
```

---
تم التحديث: 2025-01-07
الإصدار: 1.0

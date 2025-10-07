# 🚀 دليل تشغيل ToDoOS على خادم أوبنتو لينكس

## 📋 **المتطلبات الأساسية**

### **1. المتطلبات المادية للخادم**:
- **النظام**: Ubuntu 22.04 LTS أو أحدث
- **الذاكرة RAM**: 4GB كحد أدنى (8+ موصى به)
- **مساحة التخزين**: 50GB كحد أدنى
- **المعالج**: 2+ cores
- **الاتصال**: إنترنت مستقر

### **2. المتطلبات البرمجية**:

#### **أ. .NET 9.0 Runtime & SDK**
```bash
# إضافة مستودع Microsoft
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# تثبيت .NET 9.0
sudo apt update
sudo apt install -y dotnet-sdk-9.0 aspnetcore-runtime-9.0
```

#### **ب. Node.js 18+ و npm**
```bash
# باستخدام NVM (الطريقة الموصى بها)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

nvm install 18
nvm use 18

# أو تثبيت مباشر
sudo apt install -y nodejs npm
```

#### **ج. قاعدة البيانات (SQL Server)**
**الخيار 1: SQL Server على أوبنتو**
```bash
# إضافة مستودع Microsoft SQL Server
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/22.04/mssql-server.list | sudo tee /etc/apt/sources.list.d/mssql-server.list

sudo apt update
sudo apt install -y mssql-server

# تهيئة SQL Server
sudo /opt/mssql/bin/mssql-conf setup
```

**الخيار 2: PostgreSQL (مجاني ومفتوح المصدر)**
```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres createdb ToDoOS
sudo -u postgres psql -c "CREATE USER todoos WITH PASSWORD 'your_strong_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ToDoOS TO todoos;"
```

#### **د. Nginx (الويبサーバ)**
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### **ه. Let's Encrypt SSL (مجاني)**
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### **و. Git**
```bash
sudo apt install -y git
```

## 🔧 **خطوات التثبيت والتشغيل**

### **الخطوة 1: إعداد المستخدم والأدلة**
```bash
# إنشاء مستخدم مخصص للتطبيق
sudo useradd -m -s /bin/bash todoos
sudo usermod -aG sudo todoos

# التبديل للمستخدم
su - todoos

# إنشاء أدلة التطبيق
mkdir -p ~/todoos-api ~/todoos-web ~/todoos-backups
cd ~/todoos-api
```

### **الخطوة 2: استنساخ الكود**
```bash
# استنساخ المشروع
git clone https://github.com/fmsghamdi/ToDo.git ~/todoos-project
cd ~/todoos-project

# نسخ الملفات للأدلة المناسبة
cp -r src/TaqTask.Api/* ~/todoos-api/
cp -r web/* ~/todoos-web/
```

### **الخطوة 3: إعداد قاعدة البيانات**

#### **لـ SQL Server:**
```bash
# إنشاء قاعدة البيانات
sudo /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P 'your_sa_password' -Q "CREATE DATABASE ToDoOS;"
sudo /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P 'your_sa_password' -d ToDoOS -i ~/todoos-project/database/create_tables_simple.sql"
```

#### **لـ PostgreSQL:**
```bash
# تنفيذ سكريبت الجداول
sudo -u postgres psql -d ToDoOS -f ~/todoos-project/database/postgresql_create_tables.sql
```

### **الخطوة 4: إعداد الـ Backend**

```bash
cd ~/todoos-api

# استعادة الحزم
dotnet restore

# بناء المشروع
dotnet build -c Release

# إملاء ملف الإعدادات
cp appsettings.json appsettings.Development.json
nano appsettings.Development.json
```

**محتوى appsettings.Development.json:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ToDoOS;User Id=todoos;Password=your_strong_password;TrustServerCertificate=True"
  },
  "JwtSettings": {
    "SecretKey": "ToDoOS_Super_Secret_Key_2024_Change_In_Production",
    "Issuer": "ToDoOS",
    "Audience": "ToDoOS-Users"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### **الخطوة 5: إعداد الـ Frontend**

```bash
cd ~/todoos-web

# تثبيت الحزم
npm install

# بناء التطبيق
npm run build
```

### **الخطوة 6: إعداد Nginx**

```bash
# إنشاء ملف الإعدادات
sudo nano /etc/nginx/sites-available/todoos
```

**محتوى ملف الإعدادات:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # للـ API
    location /api/ {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # للـ Frontend
    location / {
        root /home/todoos/todoos-web/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # لملفات الـ Static
    location /assets/ {
        root /home/todoos/todoos-web/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/todoos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **الخطوة 7: إعداد SSL مجاني**

```bash
# الحصول على شهادة SSL
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### **الخطوة 8: إنشاء خدمات النظام**

```bash
# إنشاء خدمة للـ API
sudo nano /etc/systemd/system/todoos-api.service
```

**محتوى الملف:**
```ini
[Unit]
Description=ToDoOS API Server
After=network.target

[Service]
WorkingDirectory=/home/todoos/todoos-api
ExecStart=/usr/bin/dotnet /home/todoos/todoos-api/TaqTask.Api.dll
Restart=always
RestartSec=10
User=todoos
Group=todoos
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

[Install]
WantedBy=multi-user.target
```

```bash
# إنشاء خدمة لـ Nginx (موجودة بالفعل)
sudo systemctl daemon-reload
sudo systemctl enable todoos-api
sudo systemctl start todoos-api
```

## 🔄 **النسخ الاحتياطي واستعادة البيانات**

### **نسخة احتياطية تلقائية**
```bash
#!/bin/bash
#!/bin/bash

# إعداد المتغيرات
BACKUP_DIR="/home/todoos/todoos-backups"
DB_NAME="ToDoOS"
DB_USER="todoos"
DB_PASS="your_strong_password"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/todoos_backup_$DATE.sql"

# إنشاء النسخة الاحتياطية
sudo /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P 'your_sa_password' -Q "BACKUP DATABASE [$DB_NAME] TO DISK = N'$BACKUP_FILE' WITH NOFORMAT, NOINIT, NAME = 'ToDoOS-Full Database Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10, CHECKSUM, STOPONERROR, REWIND, WITH  DESCRIPTION = 'Automated backup created on $(date)', MEDIANUMBER = 1, MAXTRANSFERSIZE = 1048576, BLOCKSIZE = 65536, BUFFERCOUNT = 128, DURATION = 0, compression, stats = 10, checksum, stoponerror"

# ضغط النسخة الاحتياطية
gzip $BACKUP_FILE

# الاحتفاظ بالنسخ الاحتياطية لمدة 7 أيام
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "تم إنشاء النسخة الاحتياطية: $BACKUP_FILE.gz"
```

### **جدول المهمات المجدولة (Cron)**
```bash
# إضافة مهمة مجدولة
crontab -e
```

أضف السطر التالي:
```bash
# النسخ الاحتياطية اليومية في الساعة 2 صباحاً
0 2 * * * /home/todoos/backup_script.sh >> /home/todoos/backup.log 2>&1
```

## 📊 **مراقبة الأداء**

### **تثبيت Prometheus و Grafana (اختياري)**
```bash
# تثبيت Docker (للسهولة)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker todoos

# تشغيل Prometheus
docker run -d --name prometheus -p 9090:9090 prom/prometheus

# تشغيل Grafana
docker run -d --name grafana -p 3000:3000 grafana/grafana
```

## 🔧 **إصلاح المشاكل الشائعة**

### **1. مشاكل الاتصال بقاعدة البيانات**
```bash
# التحقق من حالة SQL Server
sudo systemctl status mssql-server

# التحقق من اتصال قاعدة البيانات
sudo /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P 'your_sa_password' -Q "SELECT 1"
```

### **2. مشاكل الذاكرة**
```bash
# زيادة مساحة الـ Swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# إضافة للتمهيد
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### **3. مشاكل الشبكة**
```bash
# فتح المنافذ
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 🎯 **التحقق من التشغيل**

### **1. التحقق من الـ API**
```bash
curl http://localhost:5000/api/health
```

**النتيجة المتوقعة:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-02T06:55:00Z",
  "message": "API Server is running"
}
```

### **2. التحقق من الـ Frontend**
```bash
curl -I http://localhost
```

### **3. التحقق من قاعدة البيانات**
```bash
# لـ SQL Server
sudo /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P 'your_sa_password' -d ToDoOS -Q "SELECT COUNT(*) FROM users;"

# لـ PostgreSQL
sudo -u postgres psql -d ToDoOS -c "SELECT COUNT(*) FROM users;"
```

## 📞 **الدعم والصيانة**

### **التحديثات الدورية**
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تحديث .NET
sudo apt update && sudo apt install dotnet-sdk-9.0 aspnetcore-runtime-9.0

# تحديث Node.js
nvm install latest
nvm use latest
```

### **مراقبة السجلات**
```bash
# سجلات الـ API
journalctl -u todoos-api -f

# سجلات Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# سجلات النظام
tail -f /var/log/syslog
```

---

## 🎉 **التهانين!**

لقد نجحت في تثبيت ToDoOS على خادم أوبنتو لينكس. الآن يمكنك الوصول إلى النظام عبر:

- **الموقع الرئيسي**: https://your-domain.com
- **API Health Check**: https://your-domain.com/api/health
- **لوحة التحكم**: https://your-domain.com

**تذكر تغيير كلمات المرور الافتراضية وتعيين إعدادات الأمان المناسبة!**

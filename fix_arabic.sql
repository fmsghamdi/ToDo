USE ToDoOS;
UPDATE users SET full_name = 'مدير النظام' WHERE id = 1;
UPDATE subscription_plans SET DisplayNameAr = 'مجاني', Description = 'ابدأ بتجربة مجانية لمدة 30 يوم' WHERE Id = 1;
UPDATE subscription_plans SET DisplayNameAr = 'أساسي', Description = 'للفرق الصغيرة' WHERE Id = 2;
UPDATE subscription_plans SET DisplayNameAr = 'احترافي', Description = 'للشركات النامية' WHERE Id = 3;
UPDATE subscription_plans SET DisplayNameAr = 'مؤسسات', Description = 'للشركات الكبيرة' WHERE Id = 4;

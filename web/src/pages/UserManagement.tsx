import React, { useState } from "react";
import type { User, Permission, Role } from "../UserTypes";
import { ALL_PERMISSIONS, DEFAULT_ADMIN_PERMISSIONS, DEFAULT_EMPLOYEE_PERMISSIONS } from "../UserTypes";
import { useLanguage } from "../i18n/useLanguage";

type Props = {
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, "id">) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
};

export default function UserManagement({ users, currentUser, onAddUser, onUpdateUser, onDeleteUser }: Props) {
  const { t, language } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  
  // Add user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee" as Role,
    permissions: [...DEFAULT_EMPLOYEE_PERMISSIONS] as Permission[],
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      alert(language === 'ar' ? "الرجاء إدخال جميع البيانات المطلوبة" : "Please enter all required fields");
      return;
    }
    
    if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      alert(language === 'ar' ? "البريد الإلكتروني مستخدم بالفعل" : "Email already exists");
      return;
    }

    onAddUser(newUser);
    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "employee",
      permissions: [...DEFAULT_EMPLOYEE_PERMISSIONS],
    });
    setShowAddForm(false);
  };

  const handleRoleChange = (userId: string, newRole: Role) => {
    const defaultPermissions = newRole === "admin" ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_EMPLOYEE_PERMISSIONS;
    onUpdateUser(userId, { 
      role: newRole, 
      permissions: [...defaultPermissions] 
    });
  };

  const handlePermissionToggle = (userId: string, permission: Permission) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const hasPermission = user.permissions.includes(permission);
    const newPermissions = hasPermission
      ? user.permissions.filter(p => p !== permission)
      : [...user.permissions, permission];

    onUpdateUser(userId, { permissions: newPermissions });
  };

  const getPermissionLabel = (permission: Permission): string => {
    const labelsAr: Record<Permission, string> = {
      view_board: "عرض اللوحة",
      view_dashboard: "عرض لوحة المعلومات",
      view_control_panel: "عرض لوحة التحكم",
      create_task: "إنشاء مهام",
      edit_task: "تعديل المهام",
      delete_task: "حذف المهام",
      move_task: "نقل المهام",
      manage_users: "إدارة المستخدمين",
      manage_board: "إدارة الأعمدة",
    };
    const labelsEn: Record<Permission, string> = {
      view_board: "View Board",
      view_dashboard: "View Dashboard",
      view_control_panel: "View Control Panel",
      create_task: "Create Tasks",
      edit_task: "Edit Tasks",
      delete_task: "Delete Tasks",
      move_task: "Move Tasks",
      manage_users: "Manage Users",
      manage_board: "Manage Columns",
    };
    return (language === 'ar' ? labelsAr : labelsEn)[permission];
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {language === 'ar' ? '+ إضافة مستخدم' : '+ Add User'}
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h3 className="font-semibold mb-3">{language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}</h3>
          <form onSubmit={handleAddUser} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder={t.name}
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="border rounded p-2"
                required
              />
              <input
                type="email"
                placeholder={t.email}
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="border rounded p-2"
                required
              />
              <input
                type="password"
                placeholder={t.password}
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="border rounded p-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'الدور' : 'Role'}</label>
              <select
                value={newUser.role}
                onChange={(e) => {
                  const role = e.target.value as Role;
                  const permissions = role === "admin" ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_EMPLOYEE_PERMISSIONS;
                  setNewUser({ ...newUser, role, permissions: [...permissions] });
                }}
                className="border rounded p-2"
              >
                <option value="employee">{language === 'ar' ? 'موظف' : 'Employee'}</option>
                <option value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {t.add}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="border rounded p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
                <span className={`inline-block px-2 py-1 rounded text-xs ${
                  user.role === "admin" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                }`}>
                  {user.role === "admin" ? (language === 'ar' ? 'مدير' : 'Admin') : (language === 'ar' ? 'موظف' : 'Employee')}
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {editingUser === user.id ? (language === 'ar' ? 'إخفاء' : 'Hide') : t.edit}
                </button>
                {user.id !== currentUser.id && (
                  <button
                    onClick={() => {
                      if (confirm(language === 'ar' ? `هل أنت متأكد من حذف المستخدم ${user.name}؟` : `Are you sure you want to delete user ${user.name}?`)) {
                        onDeleteUser(user.id);
                      }
                    }}
                    className="text-red-600 hover:underline text-sm"
                  >
                    {t.delete}
                  </button>
                )}
              </div>
            </div>

            {editingUser === user.id && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'الدور' : 'Role'}</label>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                    className="border rounded p-2"
                    disabled={user.id === currentUser.id}
                  >
                    <option value="employee">{language === 'ar' ? 'موظف' : 'Employee'}</option>
                    <option value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</option>
                  </select>
                  {user.id === currentUser.id && (
                    <p className="text-xs text-gray-500 mt-1">{language === 'ar' ? 'لا يمكن تغيير دورك الخاص' : "You can't change your own role"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{language === 'ar' ? 'الصلاحيات' : 'Permissions'}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PERMISSIONS.map((permission) => (
                      <label key={permission} className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={user.permissions.includes(permission)}
                          onChange={() => handlePermissionToggle(user.id, permission)}
                          disabled={user.id === currentUser.id && permission === "manage_users"}
                        />
                        <span className="text-sm">{getPermissionLabel(permission)}</span>
                      </label>
                    ))}
                  </div>
                  {user.id === currentUser.id && (
                    <p className="text-xs text-gray-500 mt-2">
                      {language === 'ar' ? 'لا يمكن إزالة صلاحية إدارة المستخدمين من حسابك الخاص' : "You can't remove Manage Users permission from your own account"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          {language === 'ar' ? 'لا يوجد مستخدمون مسجلون' : 'No users found'}
        </div>
      )}
    </div>
  );
}

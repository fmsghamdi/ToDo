import React, { useState } from "react";
import type { User, Permission, Role } from "../UserTypes";
import { ALL_PERMISSIONS, DEFAULT_ADMIN_PERMISSIONS, DEFAULT_EMPLOYEE_PERMISSIONS } from "../UserTypes";
import { useLanguage } from "../i18n/useLanguage";
import { authService, type ADUser } from "../services/AuthService";

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
  const [showADSearch, setShowADSearch] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  
  // Add user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee" as Role,
    permissions: [...DEFAULT_EMPLOYEE_PERMISSIONS] as Permission[],
  });

  // AD Search state
  const [adUsers, setAdUsers] = useState<ADUser[]>([]);
  const [loadingAD, setLoadingAD] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedADUser, setSelectedADUser] = useState<ADUser | null>(null);
  const [adUserPermissions, setAdUserPermissions] = useState<Permission[]>([...DEFAULT_EMPLOYEE_PERMISSIONS]);
  const [adUserRole, setAdUserRole] = useState<Role>("employee");

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

  // Load users from AD
  const handleLoadADUsers = async () => {
    // Fetch latest AD config from server
    await authService.fetchADConfigFromServer();
    const config = authService.getADConfig();
    if (!config || !config.enabled) {
      alert(language === 'ar'
        ? 'الدليل النشط غير مفعل. يرجى تفعيله من إعدادات النظام.'
        : 'Active Directory is not enabled. Please enable it in System Settings.');
      return;
    }

    setLoadingAD(true);
    setShowADSearch(true);
    
    try {
      const users = await authService.syncUsersFromAD(searchQuery);
      setAdUsers(users);
      
      if (users.length === 0) {
        // Show message if no users found
        console.log('No users found in Active Directory');
      }
    } catch (error) {
      alert(language === 'ar' 
        ? 'فشل تحميل المستخدمين من الدليل النشط. تأكد من صحة الإعدادات.'
        : 'Failed to load users from Active Directory. Please check your settings.');
      console.error('AD sync error:', error);
    } finally {
      setLoadingAD(false);
    }
  };

  // Search AD users when query changes
  const handleSearchAD = async () => {
    if (!showADSearch) return;
    
    setLoadingAD(true);
    try {
      const users = await authService.syncUsersFromAD(searchQuery);
      setAdUsers(users);
    } catch (error) {
      console.error('AD search error:', error);
    } finally {
      setLoadingAD(false);
    }
  };

  // Debounce search
  React.useEffect(() => {
    if (!showADSearch) return;
    
    const timeoutId = setTimeout(() => {
      handleSearchAD();
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchQuery, showADSearch]);

  // Add user from AD
  const handleAddADUser = () => {
    if (!selectedADUser) {
      alert(language === 'ar' ? 'الرجاء اختيار مستخدم' : 'Please select a user');
      return;
    }

    // Check if user already exists
    if (users.some(u => u.email === selectedADUser.email)) {
      alert(language === 'ar' 
        ? 'هذا المستخدم مضاف بالفعل إلى النظام'
        : 'This user is already added to the system');
      return;
    }

    // Create user from AD user data
    const newUserData: Omit<User, "id"> = {
      name: selectedADUser.displayName,
      email: selectedADUser.email,
      password: '', // AD users don't need local passwords
      role: adUserRole,
      permissions: [...adUserPermissions],
      avatar: '👤',
      department: selectedADUser.department,
      title: selectedADUser.title,
      isADUser: true,
    };

    onAddUser(newUserData);
    
    // Reset states
    setSelectedADUser(null);
    setAdUserPermissions([...DEFAULT_EMPLOYEE_PERMISSIONS]);
    setAdUserRole("employee");
    setShowADSearch(false);
    setSearchQuery("");
    
    alert(language === 'ar' 
      ? `تم إضافة المستخدم ${selectedADUser.displayName} بنجاح`
      : `User ${selectedADUser.displayName} added successfully`);
  };

  // Toggle AD user permission
  const toggleADPermission = (permission: Permission) => {
    if (adUserPermissions.includes(permission)) {
      setAdUserPermissions(adUserPermissions.filter(p => p !== permission));
    } else {
      setAdUserPermissions([...adUserPermissions, permission]);
    }
  };

  // Filter AD users by search query
  const filteredADUsers = adUsers.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex gap-2">
          <button
            onClick={handleLoadADUsers}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <span>🔗</span>
            {language === 'ar' ? 'إضافة من الدليل النشط' : 'Add from AD'}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {language === 'ar' ? '+ إضافة مستخدم' : '+ Add User'}
          </button>
        </div>
      </div>

      {/* AD User Search Modal */}
      {showADSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {language === 'ar' ? 'إضافة مستخدم من الدليل النشط' : 'Add User from Active Directory'}
              </h3>
              <button
                onClick={() => {
                  setShowADSearch(false);
                  setSelectedADUser(null);
                  setSearchQuery("");
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Search Box */}
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder={language === 'ar' ? 'بحث بالاسم أو البريد أو القسم...' : 'Search by name, email or department...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingAD ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {language === 'ar' ? 'جاري تحميل المستخدمين...' : 'Loading users...'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AD Users List */}
                  <div className="space-y-2">
                    <h4 className="font-medium mb-2">
                      {language === 'ar' ? 'المستخدمون المتاحون' : 'Available Users'}
                      {filteredADUsers.length > 0 && (
                        <span className="text-sm text-gray-500 ml-2">({filteredADUsers.length})</span>
                      )}
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredADUsers.map((adUser) => (
                        <button
                          key={adUser.id}
                          onClick={() => setSelectedADUser(adUser)}
                          className={`w-full text-left p-3 rounded border transition-colors ${
                            selectedADUser?.id === adUser.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium">{adUser.displayName}</div>
                          <div className="text-sm text-gray-600">{adUser.email}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {adUser.department} • {adUser.title}
                          </div>
                        </button>
                      ))}
                      {filteredADUsers.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          {language === 'ar' ? 'لم يتم العثور على مستخدمين' : 'No users found'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected User & Permissions */}
                  {selectedADUser && (
                    <div className="border rounded p-4 bg-gray-50">
                      <h4 className="font-medium mb-3">
                        {language === 'ar' ? 'تعيين الصلاحيات' : 'Assign Permissions'}
                      </h4>
                      
                      <div className="mb-4 p-3 bg-white rounded border">
                        <div className="font-medium">{selectedADUser.displayName}</div>
                        <div className="text-sm text-gray-600">{selectedADUser.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedADUser.department} • {selectedADUser.title}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                          {language === 'ar' ? 'الدور' : 'Role'}
                        </label>
                        <select
                          value={adUserRole}
                          onChange={(e) => {
                            const role = e.target.value as Role;
                            const permissions = role === "admin" ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_EMPLOYEE_PERMISSIONS;
                            setAdUserRole(role);
                            setAdUserPermissions([...permissions]);
                          }}
                          className="w-full border rounded p-2"
                        >
                          <option value="employee">{language === 'ar' ? 'موظف' : 'Employee'}</option>
                          <option value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {language === 'ar' ? 'الصلاحيات' : 'Permissions'}
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {ALL_PERMISSIONS.map((permission) => (
                            <label key={permission} className="flex items-center space-x-2 space-x-reverse">
                              <input
                                type="checkbox"
                                checked={adUserPermissions.includes(permission)}
                                onChange={() => toggleADPermission(permission)}
                                className="rounded"
                              />
                              <span className="text-sm">{getPermissionLabel(permission)}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t flex gap-2">
                        <button
                          onClick={handleAddADUser}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          {language === 'ar' ? 'إضافة المستخدم' : 'Add User'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedADUser(null);
                            setAdUserPermissions([...DEFAULT_EMPLOYEE_PERMISSIONS]);
                            setAdUserRole("employee");
                          }}
                          className="px-4 py-2 border rounded hover:bg-gray-100"
                        >
                          {t.cancel}
                        </button>
                      </div>
                    </div>
                  )}

                  {!selectedADUser && filteredADUsers.length > 0 && (
                    <div className="flex items-center justify-center text-gray-500 text-sm border-2 border-dashed rounded p-8">
                      {language === 'ar' 
                        ? 'اختر مستخدماً من القائمة لتعيين الصلاحيات'
                        : 'Select a user from the list to assign permissions'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              <div className="mt-4 p-3 bg-gray-50 rounded space-y-3">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'الاسم' : 'Name'}</label>
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) => onUpdateUser(user.id, { name: e.target.value })}
                    className="border rounded p-2 w-full"
                  />
                </div>
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input
                    type="email"
                    value={user.email}
                    onChange={(e) => onUpdateUser(user.id, { email: e.target.value })}
                    className="border rounded p-2 w-full"
                  />
                </div>
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

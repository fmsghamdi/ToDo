import type { User } from "../UserTypes";
import UserManagement from "./UserManagement";
import InviteUsers from "../components/InviteUsers";
import SubscriptionPanel from "../components/SubscriptionPanel";
import { useLanguage } from "../i18n/useLanguage";

type Props = {
  currentUser: User;
  users: User[];
  onAddUser: (user: Omit<User, "id">) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
};

export default function ControlPanel({ 
  currentUser, 
  users, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser 
}: Props) {
  const { t, language } = useLanguage();
  
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-100 p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">{t.controlPanel}</h1>
      <p className="text-gray-600 mb-6">{language === 'ar' ? 'إدارة الحسابات وإعدادات المنصة' : 'Manage accounts and platform settings'}</p>

      {/* Subscription Panel */}
      {(currentUser.tenantId || 1) !== 1 && (
        <div className="mb-6">
          <SubscriptionPanel />
        </div>
      )}

      {/* User Management - Only for admins */}
      {currentUser.permissions.includes("manage_users") && (
        <div className="space-y-6">
          <UserManagement
            users={users}
            currentUser={currentUser}
            onAddUser={onAddUser}
            onUpdateUser={onUpdateUser}
            onDeleteUser={onDeleteUser}
          />
          <InviteUsers />
        </div>
      )}

      {!currentUser.permissions.includes("manage_users") && (
        <div className="bg-white p-6 rounded shadow text-center">
          <div className="text-gray-500 text-lg mb-2">🔒</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">{language === 'ar' ? 'غير مصرح' : 'Unauthorized'}</h3>
          <p className="text-gray-600">{language === 'ar' ? 'ليس لديك صلاحية للوصول إلى لوحة التحكم' : 'You do not have permission to access the control panel'}</p>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import type { User } from '../UserTypes';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  currentUser: User;
  onPasswordChange: (userId: string, newPassword: string, currentPassword?: string) => Promise<string | null>;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
  user,
  currentUser,
  onPasswordChange
}) => {
  const { t, language } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isChangingOwnPassword = user.id === currentUser.id;
  const isAdmin = currentUser.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword.length < 4) {
      setError(t.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    // For own password change, current password is required
    if (isChangingOwnPassword && !currentPassword.trim()) {
      setError(t.fieldRequired);
      return;
    }

    setIsLoading(true);
    try {
      const result = await onPasswordChange(
        user.id, 
        newPassword.trim(), 
        isChangingOwnPassword ? currentPassword.trim() : undefined
      );
      
      if (result) {
        setError(result);
      } else {
        // Success
        alert(t.passwordChanged);
        onClose();
        resetForm();
      }
    } catch {
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {t.changePassword} - {user.name}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password - only for own password change */}
            {isChangingOwnPassword && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.currentPassword}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.newPassword}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={4}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.confirmPassword}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={4}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            {/* Info message for admin changing other user's password */}
            {!isChangingOwnPassword && isAdmin && (
              <div className="text-blue-600 text-sm bg-blue-50 p-2 rounded">
                {language === 'ar' 
                  ? 'كمدير، يمكنك تغيير كلمة مرور المستخدم بدون الحاجة لكلمة المرور الحالية'
                  : 'As an admin, you can change the user\'s password without requiring their current password'
                }
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                disabled={isLoading}
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? t.loading : t.changePassword}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeModal;

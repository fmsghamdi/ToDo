import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/useLanguage";
import { authService, type ADUser } from "../services/AuthService";

type Props = {
  onLogin: (email: string, password: string) => string | null;
  onADLogin: (user: ADUser) => void;
  onShowRegister: () => void;
  onShowForgotPassword?: () => void;
  onShowTenantRegister?: () => void;
};

export default function Login({ onLogin, onADLogin, onShowRegister, onShowForgotPassword, onShowTenantRegister }: Props) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'local' | 'ad' | 'office365'>('local');
  const [isADConfigLoading, setIsADConfigLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsADConfigLoading(true);
      await authService.fetchADConfigFromServer();
      setIsADConfigLoading(false);
    };
    fetchConfig();
  }, []);

  const isADEnabled = authService.isADEnabled();
  const isOffice365Enabled = authService.isOffice365Enabled();
  const adConfig = authService.getADConfig(); // Get the fetched config for display if needed

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError(t.fieldRequired || "الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      setIsLoading(false);
      return;
    }

    const res = onLogin(email.trim().toLowerCase(), password.trim());
    if (res) setError(res);
    setIsLoading(false);
  };

  const handleADLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("الرجاء إدخال اسم المستخدم وكلمة المرور");
      setIsLoading(false);
      return;
    }

    try {
      const result = await authService.authenticateWithAD(email.trim(), password.trim());
      
      if (result.success && result.user) {
        onADLogin(result.user);
      } else {
        setError(result.error || "فشل في تسجيل الدخول عبر Active Directory");
      }
    } catch {
      setError("حدث خطأ أثناء تسجيل الدخول");
    }
    
    setIsLoading(false);
  };

  const handleOffice365Login = async () => {
    setError("");
    setIsLoading(true);

    try {
      const result = await authService.authenticateWithOffice365();
      
      if (result.success && result.user) {
        onADLogin(result.user);
      } else {
        setError(result.error || "فشل في تسجيل الدخول عبر Office 365");
      }
    } catch {
      setError("حدث خطأ أثناء تسجيل الدخول عبر Office 365");
    }
    
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (loginMethod === 'ad') {
      handleADLogin(e);
    } else {
      handleLocalLogin(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8 border border-green-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl">🇸🇦</span>
            <h1 className="text-3xl font-bold text-gray-800">ToDoOS</h1>
          </div>
          <p className="text-gray-600">
            نظام إدارة المهام الحكومي السعودي
          </p>
        </div>

        {/* Login Method Selector */}
        {isADConfigLoading ? (
          <div className="mb-6 text-center text-gray-500">
            جاري تحميل إعدادات الدخول...
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setLoginMethod('local')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  loginMethod === 'local'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                حساب محلي
              </button>
              {isADEnabled && (
                <button
                  type="button"
                  onClick={() => setLoginMethod('ad')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    loginMethod === 'ad'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Active Directory
                </button>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {loginMethod === 'ad' ? 'اسم المستخدم' : t.email}
            </label>
            <input
              type={loginMethod === 'ad' ? 'text' : 'email'}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder={loginMethod === 'ad' ? 'username' : 'example@email.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t.password}
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isADConfigLoading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                جاري تسجيل الدخول...
              </>
            ) : (
              <>
                {loginMethod === 'ad' ? '🔐' : '📧'} {t.loginButton}
              </>
            )}
          </button>
        </form>

        {/* Office 365 Login */}
        {isOffice365Enabled && (
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">أو</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleOffice365Login}
              disabled={isLoading || isADConfigLoading}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  جاري الاتصال...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 12h-7v7h7v-7zm-8.5 0h-7v7h7v-7zm-8.5 0h-6.5v7h6.5v-7zm0-8.5v7h6.5v-7h-6.5zm8.5 0v7h7v-7h-7zm8.5 0v7h7v-7h-7z"/>
                  </svg>
                  تسجيل الدخول عبر Office 365
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-6 space-y-3">
          {loginMethod === 'local' && (
            <div className="text-center">
              <button 
                onClick={onShowForgotPassword} 
                className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
              >
                {t.forgotPassword}
              </button>
            </div>
          )}

          {loginMethod === 'local' && (
            <div className="text-sm text-gray-600 text-center">
              ليس لديك حساب؟
              <button 
                onClick={onShowRegister} 
                className="text-green-600 hover:text-green-700 font-medium mr-1 transition-colors"
              >
                {t.registerButton}
              </button>
            </div>
          )}

          {loginMethod === 'local' && onShowTenantRegister && (
            <div className="text-center pt-2 border-t border-gray-100">
              <button 
                onClick={onShowTenantRegister} 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                🏢 تسجيل جهة جديدة (منظمة)
              </button>
            </div>
          )}
        </div>

        {/* AD Status */}
        {isADEnabled && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Active Directory متصل
              {adConfig?.domain && (
                <span className="text-gray-400">({adConfig.domain})</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

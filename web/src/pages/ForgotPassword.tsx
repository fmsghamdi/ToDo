import React, { useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

type Props = {
  onForgotPassword: (email: string) => Promise<string | null>;
  onBackToLogin: () => void;
};

export default function ForgotPassword({ onForgotPassword, onBackToLogin }: Props) {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError(t.fieldRequired);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(t.invalidEmail);
      return;
    }

    setIsLoading(true);
    try {
      const result = await onForgotPassword(email.trim().toLowerCase());
      if (result) {
        setError(result);
      } else {
        setSuccess(true);
      }
    } catch {
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white shadow-md rounded-lg w-full max-w-md p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-green-600">{t.success}</h1>
            <p className="text-gray-600 mb-6">
              {t.passwordResetSent}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {language === 'ar' 
                ? 'تحقق من بريدك الإلكتروني واتبع التعليمات لإعادة تعيين كلمة المرور'
                : 'Check your email and follow the instructions to reset your password'
              }
            </p>
            <button
              onClick={onBackToLogin}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              {t.backToLogin}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-md rounded-lg w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.414-6.414a6 6 0 017.743-5.743z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">{t.resetPasswordTitle}</h1>
          <p className="text-sm text-gray-600">
            {t.enterEmailForReset}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.email}</label>
            <input
              type="email"
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? t.loading : t.sendResetLink}
          </button>
        </form>

        <div className="text-center mt-6">
          <button 
            onClick={onBackToLogin} 
            className="text-blue-600 hover:underline text-sm"
            disabled={isLoading}
          >
            {t.backToLogin}
          </button>
        </div>
      </div>
    </div>
  );
}

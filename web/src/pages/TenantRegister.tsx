import React, { useState } from "react";
import apiService from "../services/ApiService";
import { isDisposableEmail } from "../utils/disposableEmail";

type Props = {
  onRegisterSuccess: (tenantId: number, tenantName: string) => void;
  onShowLogin: () => void;
};

export default function TenantRegister({ onRegisterSuccess, onShowLogin }: Props) {
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [email, setEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!name.trim() || !subdomain.trim() || !email.trim()) {
      setError("الرجاء إدخال اسم الجهة والدومين الفرعي والبريد الإلكتروني");
      setIsLoading(false);
      return;
    }

    if (isDisposableEmail(email.trim())) {
      setError("لا يُسمح باستخدام بريد مؤقت. الرجاء استخدام بريد دائم.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await apiService.registerTenant({
        name: name.trim(),
        subdomain: subdomain.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        companyPhone: companyPhone.trim(),
      });
      onRegisterSuccess(result.id, result.name);
    } catch (err: any) {
      setError(err.message || "فشل في تسجيل الجهة");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8 border border-green-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">تسجيل جهة جديدة</h1>
          <p className="text-gray-600 mt-2">
            إنشاء حساب مؤسسي لنظام إدارة المهام
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">اسم الجهة</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="مثال: شركة الأمل"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">الدومين الفرعي</label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
              <input
                className="flex-1 px-4 py-3 outline-none border-none"
                placeholder="company-name"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                disabled={isLoading}
              />
              <span className="px-3 text-gray-500 bg-gray-50 py-3 text-sm">.todoos.com</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">البريد الإلكتروني</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">رقم الهاتف (اختياري)</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="+966 5X XXX XXXX"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
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
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? "جاري التسجيل..." : "تسجيل الجهة"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={onShowLogin} className="text-green-600 hover:text-green-700 text-sm font-medium">
            لديك حساب بالفعل؟ تسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

type Props = {
  onRegister: (name: string, email: string, password: string) => string | null;
  onShowLogin: () => void;
};

export default function Register({ onRegister, onShowLogin }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("الرجاء إدخال الاسم والبريد وكلمة المرور");
      return;
    }

    const res = onRegister(name.trim(), email.trim().toLowerCase(), password.trim());
    if (res) {
      setError(res);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-md rounded-lg w-full max-w-md p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">{t.register}</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          سيتم إنشاء حساب مدير لإدارة المستخدمين والمهام
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.name}</label>
            <input
              className="w-full border rounded p-2"
              placeholder={t.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t.email}</label>
            <input
              type="email"
              className="w-full border rounded p-2"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t.password}</label>
            <input
              type="password"
              className="w-full border rounded p-2"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            {t.registerButton}
          </button>
        </form>

        <div className="text-sm text-gray-600 mt-6 text-center">
          {t.showLogin}{" "}
          <button onClick={onShowLogin} className="text-blue-600 hover:underline">
            {t.loginButton}
          </button>
        </div>
      </div>
    </div>
  );
}

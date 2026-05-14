import React, { useState } from "react";
import apiService from "../services/ApiService";

export default function InviteUsers() {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState("user");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setIsLoading(true);

    const emailList = emails
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes("@"));

    if (emailList.length === 0) {
      setResult({ type: "error", message: "الرجاء إدخال بريد إلكتروني صحيح واحد على الأقل" });
      setIsLoading(false);
      return;
    }

    try {
      const created = await apiService.createInvitations(emailList, role);
      setResult({
        type: "success",
        message: `✅ تم إرسال ${created.length} دعوة من أصل ${emailList.length} بنجاح`,
      });
      if (created.length > 0) {
        setEmails("");
      }
    } catch (err: any) {
      setResult({ type: "error", message: err.message || "فشل في إرسال الدعوات" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">📨 دعوة مستخدمين جدد</h3>
      <p className="text-sm text-gray-500 mb-4">
        أدخل البريد الإلكتروني للمستخدمين الذين تريد دعوتهم للانضمام إلى جهتك
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            البريد الإلكتروني (بريد لكل سطر أو افصل بينهم بفاصلة)
          </label>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={4}
            placeholder="user1@company.com&#10;user2@company.com&#10;user3@company.com"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={isLoading}
          >
            <option value="user">مستخدم</option>
            <option value="manager">مدير</option>
            <option value="admin">مسؤول</option>
          </select>
        </div>

        {result && (
          <div className={`px-4 py-3 rounded-lg text-sm ${
            result.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {result.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "جاري الإرسال..." : "إرسال الدعوات"}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
        <strong>ملاحظة:</strong> سيتم إرسال رابط الدعوة عبر البريد الإلكتروني. 
        المستخدم المدعو سينشئ حسابه بنفسه عبر الرابط.
      </div>
    </div>
  );
}

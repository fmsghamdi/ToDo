import { useState, useEffect } from "react";
import apiService from "../services/ApiService";
import { useLanguage } from "../i18n/useLanguage";

type TenantInfo = {
  tenantId: number;
  tenantName: string;
  tenantEmail: string;
  subdomain: string;
  plan: string;
  status: string;
  trialStart: string | null;
  trialEnd: string | null;
  daysRemaining: number;
  userCount: number;
  boardCount: number;
  createdAt: string;
};

const planNames: Record<string, string> = {
  free: "مجاني",
  pro: "احترافي",
  enterprise: "مؤسسات"
};

const planNamesEn: Record<string, string> = {
  free: "Free",
  pro: "Professional",
  enterprise: "Enterprise"
};

export default function AdminTenants() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [extending, setExtending] = useState<number | null>(null);
  const [extendDays, setExtendDays] = useState<Record<number, number>>({});
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const tenantsData = await apiService.getAllTenants();
      setTenants(tenantsData);
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }

  async function handleExtendTrial(tenantId: number) {
    const days = extendDays[tenantId] || 30;
    setExtending(tenantId);
    try {
      const result = await apiService.adminExtendTrial(tenantId, days);
      setMessage(result.message);
      await loadData();
    } catch (err: any) {
      setMessage(err.message || (isRtl ? "فشل التمديد" : "Extension failed"));
    } finally {
      setExtending(null);
    }
  }

  async function handleChangePlan(tenantId: number, planName: string) {
    try {
      const result = await apiService.adminChangePlan(tenantId, planName);
      setMessage(result.message);
      await loadData();
      setSelectedTenant(null);
    } catch (err: any) {
      setMessage(err.message || (isRtl ? "فشل تغيير الخطة" : "Plan change failed"));
    }
  }

  function getPlanDisplayName(name: string): string {
    const plans = isRtl ? planNames : planNamesEn;
    return plans[name] || name;
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-100 p-4 sm:p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-100 p-4 sm:p-6" dir={isRtl ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-bold mb-2">{isRtl ? "إدارة المؤسسات" : "Tenants Management"}</h1>
      <p className="text-gray-600 mb-6">
        {isRtl
          ? "عرض وإدارة جميع المؤسسات المسجلة في المنصة"
          : "View and manage all registered tenants on the platform"}
      </p>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes("failed") || message.includes("فشل")
            ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          {message}
        </div>
      )}

      {tenants.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
          {isRtl ? "لا توجد مؤسسات مسجلة بعد" : "No tenants registered yet"}
        </div>
      ) : (
        <div className="grid gap-4">
          {tenants.map(tenant => {
            const isExpired = tenant.daysRemaining <= 0;
            const expiringSoon = tenant.daysRemaining > 0 && tenant.daysRemaining <= 7;
            const isSelected = selectedTenant === tenant.tenantId;

            return (
              <div key={tenant.tenantId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Tenant Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {tenant.tenantName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{tenant.tenantName}</h3>
                      <p className="text-sm text-gray-500">{tenant.tenantEmail} · {tenant.subdomain}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isRtl ? "مسجل منذ: " : "Registered: "}{new Date(tenant.createdAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Plan Badge */}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      tenant.plan === "enterprise" ? "bg-purple-100 text-purple-700" :
                      tenant.plan === "pro" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {getPlanDisplayName(tenant.plan)}
                    </span>
                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isExpired ? "bg-red-100 text-red-700" :
                      expiringSoon ? "bg-yellow-100 text-yellow-700" :
                      tenant.status === "trial" ? "bg-blue-100 text-blue-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {isExpired ? (isRtl ? "منتهية" : "Expired") :
                       tenant.status === "trial" ? (isRtl ? "تجريبي" : "Trial") :
                       (isRtl ? "نشط" : "Active")}
                    </span>
                    <button
                      onClick={() => setSelectedTenant(isSelected ? null : tenant.tenantId)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {isSelected ? (isRtl ? "إخفاء" : "Hide") : (isRtl ? "إدارة" : "Manage")}
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="px-4 sm:px-5 pb-3 flex gap-4 text-sm text-gray-500">
                  <span>👥 {tenant.userCount} {isRtl ? "مستخدم" : "users"}</span>
                  <span>📋 {tenant.boardCount} {isRtl ? "لوحة" : "boards"}</span>
                  {tenant.trialEnd && (
                    <span className={isExpired ? "text-red-600 font-medium" : expiringSoon ? "text-yellow-600 font-medium" : ""}>
                      📅 {isRtl ? "متبقي " : ""}{tenant.daysRemaining} {isRtl ? "يوم" : "days"}
                    </span>
                  )}
                </div>

                {/* Expanded Management Panel */}
                {isSelected && (
                  <div className="border-t bg-gray-50 p-4 sm:p-5 space-y-4">
                    {/* Extend Trial */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">{isRtl ? "تمديد الفترة التجريبية" : "Extend Trial"}</h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={extendDays[tenant.tenantId] || 30}
                          onChange={e => setExtendDays(prev => ({ ...prev, [tenant.tenantId]: Math.max(1, parseInt(e.target.value) || 1) }))}
                          className="w-20 px-2 py-1.5 border border-gray-300 rounded text-center text-sm"
                        />
                        <span className="text-sm text-gray-500">{isRtl ? "يوم" : "days"}</span>
                        <button
                          onClick={() => handleExtendTrial(tenant.tenantId)}
                          disabled={extending === tenant.tenantId}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          {extending === tenant.tenantId ? "..." : (isRtl ? "تمديد" : "Extend")}
                        </button>
                      </div>
                    </div>

                    {/* Change Plan */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">{isRtl ? "تغيير الخطة" : "Change Plan"}</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {["free", "pro", "enterprise"].map(plan => (
                          <button
                            key={plan}
                            onClick={() => handleChangePlan(tenant.tenantId, plan)}
                            disabled={plan === tenant.plan}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                              plan === tenant.plan
                                ? "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                                : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            {getPlanDisplayName(plan)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

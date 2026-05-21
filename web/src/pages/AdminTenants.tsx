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

type UserInfo = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  tenantId: number;
  tenantName: string;
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
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [extending, setExtending] = useState<number | null>(null);
  const [extendDays, setExtendDays] = useState<Record<number, number>>({});
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"tenants" | "users">("users");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Read local users from localStorage (where existing registrations are)
    const localUsers: UserInfo[] = [];
    try {
      const raw = localStorage.getItem("users");
      if (raw) {
        const parsed = JSON.parse(raw);
        for (const u of parsed) {
          localUsers.push({
            id: parseInt(u.id) || 0,
            username: u.name || u.email,
            email: u.email,
            fullName: u.name || "",
            role: u.role || "user",
            isActive: true,
            tenantId: u.tenantId || 1,
            tenantName: u.tenantName || "ToDoOS",
            createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString()
          });
        }
      }
    } catch {}

    // Fetch from API
    try {
      const [apiUsers, tenantsData] = await Promise.all([
        apiService.getAllUsers(),
        apiService.getAllTenants()
      ]);

      // Merge: API users override local by email
      const emailMap = new Map<string, UserInfo>();
      for (const u of localUsers) emailMap.set(u.email, u);
      for (const u of apiUsers) emailMap.set(u.email, u);

      setUsers(Array.from(emailMap.values()));
      setTenants(tenantsData);
    } catch {
      // API not available — show only localStorage users
      setUsers(localUsers);
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
    const m = isRtl ? planNames : planNamesEn;
    return m[name] || name;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6" dir={isRtl ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-bold mb-2">{isRtl ? "لوحة المشرف" : "Admin Dashboard"}</h1>
      <p className="text-gray-600 mb-6">
        {isRtl
          ? "إدارة جميع المستخدمين والمؤسسات المسجلة في المنصة"
          : "Manage all users and tenants on the platform"}
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-2xl font-bold text-blue-600">{users.length}</div>
          <div className="text-sm text-gray-500">{isRtl ? "إجمالي المستخدمين" : "Total Users"}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-2xl font-bold text-green-600">{users.filter(u => u.role === "admin").length}</div>
          <div className="text-sm text-gray-500">{isRtl ? "المديرون" : "Admins"}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-2xl font-bold text-purple-600">{tenants.length}</div>
          <div className="text-sm text-gray-500">{isRtl ? "المؤسسات" : "Tenants"}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-2xl font-bold text-orange-600">{tenants.filter(t => t.daysRemaining <= 7).length}</div>
          <div className="text-sm text-gray-500">{isRtl ? "تنتهي قريباً" : "Expiring Soon"}</div>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes("failed") || message.includes("فشل")
            ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "users" ? "bg-white text-blue-600 shadow-sm border border-gray-200" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          👥 {isRtl ? "المستخدمون" : "Users"} ({users.length})
        </button>
        <button
          onClick={() => setTab("tenants")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "tenants" ? "bg-white text-blue-600 shadow-sm border border-gray-200" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🏢 {isRtl ? "المؤسسات" : "Tenants"} ({tenants.length})
        </button>
      </div>

      {/* Users Tab */}
      {tab === "users" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right p-3 font-medium text-gray-600">{isRtl ? "الاسم" : "Name"}</th>
                  <th className="text-right p-3 font-medium text-gray-600">{isRtl ? "البريد" : "Email"}</th>
                  <th className="text-right p-3 font-medium text-gray-600">{isRtl ? "الدور" : "Role"}</th>
                  <th className="text-right p-3 font-medium text-gray-600">{isRtl ? "المؤسسة" : "Tenant"}</th>
                  <th className="text-right p-3 font-medium text-gray-600">{isRtl ? "الحالة" : "Status"}</th>
                  <th className="text-right p-3 font-medium text-gray-600">{isRtl ? "تاريخ التسجيل" : "Registered"}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3 font-medium">{user.fullName || user.username}</td>
                    <td className="p-3 text-gray-600">{user.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        user.role === "admin" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {user.role === "admin" ? (isRtl ? "مدير" : "Admin") : (isRtl ? "مستخدم" : "User")}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{user.tenantName}</td>
                    <td className="p-3">
                      <span className={`inline-block w-2 h-2 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`} />
                      <span className="mr-1 text-xs">{user.isActive ? (isRtl ? "نشط" : "Active") : (isRtl ? "غير نشط" : "Inactive")}</span>
                    </td>
                    <td className="p-3 text-gray-500 text-xs">{new Date(user.createdAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">{isRtl ? "لا يوجد مستخدمون" : "No users"}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tenants Tab */}
      {tab === "tenants" && (
        <div className="grid gap-4">
          {tenants.map(tenant => {
            const isExpired = tenant.daysRemaining <= 0;
            const expiringSoon = tenant.daysRemaining > 0 && tenant.daysRemaining <= 7;
            const isSelected = selectedTenant === tenant.tenantId;

            return (
              <div key={tenant.tenantId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {tenant.tenantName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{tenant.tenantName}</h3>
                      <p className="text-sm text-gray-500">{tenant.tenantEmail} · {tenant.subdomain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      tenant.plan === "enterprise" ? "bg-purple-100 text-purple-700" :
                      tenant.plan === "pro" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {getPlanDisplayName(tenant.plan)}
                    </span>
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

                <div className="px-4 sm:px-5 pb-3 flex gap-4 text-sm text-gray-500">
                  <span>👥 {tenant.userCount} {isRtl ? "مستخدم" : "users"}</span>
                  <span>📋 {tenant.boardCount} {isRtl ? "لوحة" : "boards"}</span>
                  {tenant.trialEnd && (
                    <span className={isExpired ? "text-red-600 font-medium" : expiringSoon ? "text-yellow-600 font-medium" : ""}>
                      📅 {tenant.daysRemaining} {isRtl ? "يوم" : "days"}
                    </span>
                  )}
                </div>

                {isSelected && (
                  <div className="border-t bg-gray-50 p-4 sm:p-5 space-y-4">
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
          {tenants.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center text-gray-500">
              {isRtl ? "لا توجد مؤسسات مسجلة" : "No tenants registered"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

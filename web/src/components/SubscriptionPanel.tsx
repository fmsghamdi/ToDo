import { useState, useEffect } from "react";
import apiService from "../services/ApiService";
import { useLanguage } from "../i18n/useLanguage";

type PlanUsage = {
  currentPlan: string;
  currentUsers: number;
  maxUsers: number;
  currentBoards: number;
  maxBoards: number;
  usersPercent: number;
  boardsPercent: number;
};

type PlanDefinition = {
  name: string;
  displayName: string;
  displayNameEn: string;
  maxUsers: number;
  maxBoards: number;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
};

export default function SubscriptionPanel() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [usageData, plansData] = await Promise.all([
        apiService.getSubscriptionUsage(),
        apiService.getSubscriptionPlans()
      ]);
      setUsage(usageData);
      setPlans(plansData);
    } catch {
      // API not available
    }
  }

  async function handleUpgrade() {
    if (!selectedPlan || selectedPlan === usage?.currentPlan) return;
    setUpgrading(true);
    try {
      const result = await apiService.upgradePlan(selectedPlan);
      setMessage(result.message);
      await loadData();
      setSelectedPlan(null);
    } catch (err: any) {
      setMessage(err.message || "فشل الترقية");
    } finally {
      setUpgrading(false);
    }
  }

  if (!usage) return null;

  const planNames: Record<string, string> = {
    free: isRtl ? "مجاني" : "Free",
    pro: isRtl ? "احترافي" : "Professional",
    enterprise: isRtl ? "مؤسسات" : "Enterprise"
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100" dir={isRtl ? "rtl" : "ltr"}>
      <h2 className="text-xl font-bold mb-4">
        {isRtl ? "الاشتراك والخطة" : "Subscription & Plan"}
      </h2>

      {/* Current Plan Badge */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">{isRtl ? "الخطة الحالية" : "Current Plan"}</span>
            <h3 className="text-2xl font-bold text-gray-800">
              {planNames[usage.currentPlan] || usage.currentPlan}
            </h3>
          </div>
          {usage.currentPlan !== "enterprise" && (
            <span className="text-sm text-blue-600 font-medium">
              {isRtl ? "قابل للترقية" : "Upgradable"}
            </span>
          )}
        </div>
      </div>

      {/* Usage Meters */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{isRtl ? "المستخدمون" : "Users"}</span>
            <span className="font-medium">{usage.currentUsers} / {usage.maxUsers}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                usage.usersPercent >= 90 ? "bg-red-500" : usage.usersPercent >= 70 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(usage.usersPercent, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{isRtl ? "اللوحات" : "Boards"}</span>
            <span className="font-medium">{usage.currentBoards} / {usage.maxBoards}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                usage.boardsPercent >= 90 ? "bg-red-500" : usage.boardsPercent >= 70 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(usage.boardsPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Upgrade Section */}
      {usage.currentPlan !== "enterprise" && plans.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">{isRtl ? "ترقية الخطة" : "Upgrade Plan"}</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {plans
              .filter(p => {
                const order = ["free", "pro", "enterprise"];
                return order.indexOf(p.name) > order.indexOf(usage!.currentPlan);
              })
              .map(plan => (
                <div
                  key={plan.name}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPlan === plan.name
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => setSelectedPlan(plan.name)}
                >
                  <div className="font-bold text-lg">{isRtl ? plan.displayName : plan.displayNameEn}</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    ${plan.priceMonthly}<span className="text-sm font-normal text-gray-500">/{isRtl ? "شهر" : "mo"}</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    {plan.features.slice(0, 4).map(f => (
                      <li key={f} className="flex items-center gap-1">✓ {f}</li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-blue-500">+{plan.features.length - 4} {isRtl ? "مميزات أخرى" : "more features"}</li>
                    )}
                  </ul>
                </div>
              ))}
          </div>

          {selectedPlan && selectedPlan !== usage.currentPlan && (
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {upgrading
                ? (isRtl ? "جاري الترقية..." : "Upgrading...")
                : (isRtl ? "ترقية إلى الخطة المحددة" : "Upgrade to Selected Plan")}
            </button>
          )}

          {message && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              message.includes("failed") || message.includes("فشل")
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

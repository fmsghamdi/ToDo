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
  status: string;
  trialStart: string | null;
  trialEnd: string | null;
  daysRemaining: number;
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
  const [extendDays, setExtendDays] = useState(30);
  const [extending, setExtending] = useState(false);

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
      setMessage(err.message || (isRtl ? "فشل الترقية" : "Upgrade failed"));
    } finally {
      setUpgrading(false);
    }
  }

  async function handleExtendTrial() {
    if (extendDays < 1) return;
    setExtending(true);
    try {
      const result = await apiService.extendTrial(extendDays);
      setMessage(result.message);
      await loadData();
    } catch (err: any) {
      setMessage(err.message || (isRtl ? "فشل التمديد" : "Extension failed"));
    } finally {
      setExtending(false);
    }
  }

  if (!usage) return null;

  const planNames: Record<string, string> = {
    free: isRtl ? "مجاني" : "Free",
    pro: isRtl ? "احترافي" : "Professional",
    enterprise: isRtl ? "مؤسسات" : "Enterprise"
  };

  const isTrial = usage.status === "trial";
  const isExpired = isTrial && usage.daysRemaining <= 0;
  const expiringSoon = isTrial && usage.daysRemaining > 0 && usage.daysRemaining <= 7;
  const isFree = usage.currentPlan === "free";

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100" dir={isRtl ? "rtl" : "ltr"}>
      <h2 className="text-xl font-bold mb-4">
        {isRtl ? "الاشتراك والخطة" : "Subscription & Plan"}
      </h2>

      {/* Trial Status Banner */}
      {isTrial && (
        <div className={`mb-4 p-4 rounded-lg border ${
          isExpired
            ? "bg-red-50 border-red-200"
            : expiringSoon
            ? "bg-yellow-50 border-yellow-200"
            : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-xl">
              {isExpired ? "⛔" : expiringSoon ? "⚠️" : "🧪"}
            </span>
            <div className="flex-1">
              <p className={`font-semibold ${
                isExpired ? "text-red-700" : expiringSoon ? "text-yellow-700" : "text-blue-700"
              }`}>
                {isExpired
                  ? (isRtl ? "انتهت الفترة التجريبية" : "Trial Period Expired")
                  : (isRtl ? "الفترة التجريبية" : "Trial Period")}
              </p>
              <p className={`text-sm mt-1 ${
                isExpired ? "text-red-600" : expiringSoon ? "text-yellow-600" : "text-blue-600"
              }`}>
                {isExpired
                  ? (isRtl
                      ? `انتهت صلاحية النسخة التجريبية. قم بترقية خطتك أو تمديد الفترة التجريبية.`
                      : `Your trial has expired. Upgrade your plan or extend the trial.`)
                  : (isRtl
                      ? `متبقي ${usage.daysRemaining} يوم من الفترة التجريبية`
                      : `${usage.daysRemaining} days remaining in your trial`)}
              </p>
              {usage.trialEnd && (
                <p className="text-xs mt-1 opacity-75">
                  {isRtl ? "تنتهي في: " : "Expires: "}{new Date(usage.trialEnd).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Plan Badge */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">{isRtl ? "الخطة الحالية" : "Current Plan"}</span>
            <h3 className="text-2xl font-bold text-gray-800">
              {planNames[usage.currentPlan] || usage.currentPlan}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isTrial && (
              <span className={`text-sm font-medium px-2 py-1 rounded ${
                isExpired ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
              }`}>
                {isExpired
                  ? (isRtl ? "منتهية" : "Expired")
                  : (isRtl ? "تجريبي" : "Trial")}
              </span>
            )}
            {!isTrial && usage.currentPlan !== "enterprise" && (
              <span className="text-sm text-blue-600 font-medium">
                {isRtl ? "قابل للترقية" : "Upgradable"}
              </span>
            )}
          </div>
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

      {/* Trial Extension (admin only — shown for trial & free plans) */}
      {(isTrial || isFree) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold mb-2">
            {isRtl ? "تمديد الفترة التجريبية" : "Extend Trial"}
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            {isRtl
              ? "قم بتمديد الفترة التجريبية للمستخدمين في المنشأة."
              : "Extend the trial period for users in your organization."}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={365}
              value={extendDays}
              onChange={e => setExtendDays(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center"
            />
            <span className="text-sm text-gray-500">
              {isRtl ? "يوم" : "days"}
            </span>
            <button
              onClick={handleExtendTrial}
              disabled={extending || extendDays < 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {extending
                ? (isRtl ? "جاري..." : "Extending...")
                : (isRtl ? "تمديد" : "Extend")}
            </button>
          </div>
        </div>
      )}

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

import { useState, useEffect } from "react";
import apiService from "../services/ApiService";
import { useLanguage } from "../i18n/useLanguage";

export default function TrialBanner() {
  const { language } = useLanguage();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const usage = await apiService.getSubscriptionUsage();
        setDaysRemaining(usage.daysRemaining);
        setStatus(usage.status);
      } catch {
        // API not available
      }
    })();
  }, []);

  if (dismissed || status !== "trial" || daysRemaining === null || daysRemaining > 7) return null;

  const isExpired = daysRemaining <= 0;

  return (
    <div className={`px-4 py-2 text-sm text-center font-medium ${
      isExpired ? "bg-red-500 text-white" : "bg-yellow-400 text-yellow-900"
    }`}>
      <span>
        {isExpired
          ? (language === "ar"
              ? "انتهت الفترة التجريبية. انتقل إلى لوحة التحكم لإدارة الاشتراك."
              : "Trial expired. Go to Control Panel to manage your subscription.")
          : (language === "ar"
              ? `متبقي ${daysRemaining} يوم من الفترة التجريبية.`
              : `${daysRemaining} days remaining in your trial.`)}
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-3 font-bold opacity-75 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

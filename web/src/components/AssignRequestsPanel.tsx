import React, { useState } from "react";
import type { AssignRequest, Member } from "../Types";
import type { User } from "../UserTypes";
import { useLanguage } from "../i18n/useLanguage";

type Props = {
  requests: AssignRequest[];
  currentUser: User;
  cardMembers: Member[];
  cardId: string;
  cardTitle: string;
  onRequestAssign: (req: Omit<AssignRequest, "id" | "createdAt" | "updatedAt">) => void;
  onApprove: (reqId: string) => void;
  onReject: (reqId: string) => void;
};

const AssignRequestsPanel: React.FC<Props> = ({
  requests,
  currentUser,
  cardMembers,
  cardId,
  cardTitle,
  onRequestAssign,
  onApprove,
  onReject,
}) => {
  const { t, language } = useLanguage();
  const [showRequestForm, setShowRequestForm] = useState(false);

  const alreadyAssigned = cardMembers.some(m => m.id === currentUser.id);
  const existingRequest = requests.find(
    r => r.userId === currentUser.id && r.cardId === cardId && r.status === "pending"
  );
  const pendingRequests = requests.filter(r => r.cardId === cardId && r.status === "pending");
  const isAdmin = currentUser.role === "admin";

  const handleRequest = () => {
    onRequestAssign({
      cardId,
      cardTitle,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      status: "pending",
    });
    setShowRequestForm(false);
  };

  return (
    <div className="mb-3">
      {!alreadyAssigned && !existingRequest && !isAdmin && (
        <div>
          {!showRequestForm ? (
            <button
              onClick={() => setShowRequestForm(true)}
              className="text-sm px-3 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              {language === "ar" ? "طلب تعيين في المهمة" : "Request Assignment"}
            </button>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600">
                {language === "ar" ? "طلب التعيين في" : "Request assignment to"} "{cardTitle}"?
              </span>
              <button onClick={handleRequest} className="px-2 py-1 bg-green-600 text-white rounded text-xs">
                {language === "ar" ? "تأكيد" : "Confirm"}
              </button>
              <button onClick={() => setShowRequestForm(false)} className="px-2 py-1 bg-gray-300 rounded text-xs">
                {t.cancel}
              </button>
            </div>
          )}
        </div>
      )}

      {existingRequest && (
        <p className="text-sm text-yellow-600">
          {language === "ar" ? "✅ طلب تعيين قيد المراجعة" : "✅ Assignment request pending"}
        </p>
      )}

      {isAdmin && pendingRequests.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            {language === "ar" ? `طلبات تعيين (${pendingRequests.length})` : `Assignment Requests (${pendingRequests.length})`}
          </p>
          {pendingRequests.map(req => (
            <div key={req.id} className="flex items-center justify-between bg-yellow-50 px-3 py-2 rounded mb-1">
              <span className="text-sm">
                <span className="font-medium">{req.userName}</span>
                {" "}{language === "ar" ? "طلب التعيين" : "requested assignment"}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => onApprove(req.id)}
                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                >{language === "ar" ? "قبول" : "Approve"}</button>
                <button
                  onClick={() => onReject(req.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >{language === "ar" ? "رفض" : "Reject"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignRequestsPanel;
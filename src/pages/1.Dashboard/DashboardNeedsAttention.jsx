import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSearch, ClipboardList, MessageSquareText, CheckCircle2 } from 'lucide-react';
import {
  useGetStudentDocuments,
  useGetAvailableEvaluations,
  useGetUnreadMessageCount,
} from '../../store/tanstackStore/services/queries';

const DashboardNeedsAttention = () => {
  const navigate = useNavigate();
  const { data: documentsResponse } = useGetStudentDocuments();
  const { data: evaluationsResponse } = useGetAvailableEvaluations();
  const { data: unreadData } = useGetUnreadMessageCount();

  const items = useMemo(() => {
    const list = [];
    const awaitingReview = (documentsResponse?.documents || []).filter((doc) => !doc.reviewedAt).length;
    if (awaitingReview > 0) {
      list.push({
        key: 'documents',
        icon: FileSearch,
        label: `${awaitingReview} document${awaitingReview > 1 ? 's' : ''} awaiting supervisor review`,
        path: '/documents',
      });
    }
    const pendingEvaluations = evaluationsResponse?.evaluations?.length || 0;
    if (pendingEvaluations > 0) {
      list.push({
        key: 'evaluations',
        icon: ClipboardList,
        label: `${pendingEvaluations} evaluation${pendingEvaluations > 1 ? 's' : ''} available for submission`,
        path: '/evaluations',
      });
    }
    const unread = unreadData?.unreadCount || 0;
    if (unread > 0) {
      list.push({
        key: 'messages',
        icon: MessageSquareText,
        label: `${unread} unread message${unread > 1 ? 's' : ''}`,
        path: '/direct-messages',
      });
    }
    return list;
  }, [documentsResponse, evaluationsResponse, unreadData]);

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-5">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Needs Your Attention</h3>
      {items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="text-sm">You're all caught up</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#25369B] flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </span>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardNeedsAttention;

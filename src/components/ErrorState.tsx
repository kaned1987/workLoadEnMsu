import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
  onRetry,
}) => {
  return (
    <div 
      id="error-state-container"
      className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-8 text-center my-6 max-w-xl mx-auto"
    >
      <div className="w-14 h-14 bg-[#fee2e2] text-[#991b1b] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#fca5a5]">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-[#991b1b] mb-1">
        เกิดข้อผิดพลาดในการโหลดข้อมูล
      </h3>
      <p className="text-sm text-[#7f1d1d] mb-5">
        {message}
      </p>
      <button
        id="retry-button"
        type="button"
        onClick={onRetry}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-[#991b1b] font-medium text-sm rounded-xl border border-[#fca5a5] shadow-xs transition-colors cursor-pointer active:scale-98"
      >
        <RotateCcw className="w-4 h-4" />
        <span>ลองใหม่อีกครั้ง</span>
      </button>
    </div>
  );
};

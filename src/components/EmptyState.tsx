import React from 'react';
import { BookX, CalendarSearch } from 'lucide-react';

interface EmptyStateProps {
  type: 'initial' | 'no-data';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  if (type === 'initial') {
    return (
      <div 
        id="initial-state-container"
        className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 sm:p-14 text-center"
      >
        <div className="w-16 h-16 bg-[#fdf2f2] text-[#800000] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#f3d1d1]">
          <CalendarSearch className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          พร้อมสำหรับการค้นหาข้อมูล
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          เลือกภาคเรียนและอาจารย์เพื่อดูข้อมูลภาระงานสอน
        </p>
      </div>
    );
  }

  return (
    <div 
      id="empty-data-container"
      className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-14 text-center"
    >
      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
        <BookX className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">
        ไม่พบข้อมูลรายวิชา
      </h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto">
        ไม่พบข้อมูลรายวิชาสำหรับเงื่อนไขที่เลือก
      </p>
    </div>
  );
};

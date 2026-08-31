import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer id="app-footer" className="mt-12 py-6 border-t border-slate-200 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          <span className="font-medium text-slate-700">คณะวิศวกรรมศาสตร์ มหาวิทยาลัยมหาสารคาม</span>
          <span className="hidden sm:inline mx-2">•</span>
          <span className="block sm:inline">Faculty of Engineering, Mahasarakham University</span>
        </div>
        <div className="text-[11px] text-slate-400">
          ระบบคำนวณภาระงานสอน V1 (Milestone 1: Foundation Shell)
        </div>
      </div>
    </footer>
  );
};

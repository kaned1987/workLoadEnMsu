import React from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-22">
          {/* Logo & Branding Area */}
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div 
              id="brand-logo-badge"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#800000] text-white flex items-center justify-center shadow-sm shrink-0 border border-[#630000]"
              aria-hidden="true"
            >
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-amber-100" />
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fdf2f2] text-[#800000] border border-[#f3d1d1]">
                  EN MSU
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline-block">
                  ระบบบริการข้อมูลวิชาการ
                </span>
              </div>
              
              <h1 id="app-title" className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight mt-0.5">
                ระบบคำนวณภาระงานสอน
              </h1>
              
              <p id="app-subtitle" className="text-xs sm:text-sm text-slate-600 font-medium">
                คณะวิศวกรรมศาสตร์ มหาวิทยาลัยมหาสารคาม
              </p>
            </div>
          </div>

          {/* Right Status Indicator */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-700">Faculty of Engineering</div>
              <div className="text-[11px] text-slate-500">Mahasarakham University</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <BookOpen className="w-4 h-4 text-[#800000]" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

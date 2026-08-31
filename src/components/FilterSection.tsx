import React from 'react';
import { Calendar, User, FileSpreadsheet, RotateCcw, RefreshCw, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { SemesterOption, InstructorOption, SheetMetadata } from '../types';

interface FilterSectionProps {
  selectedSemester: string;
  selectedInstructor: string;
  semesterOptions: SemesterOption[];
  instructorOptions: InstructorOption[];
  onSemesterChange: (semesterId: string) => void;
  onInstructorChange: (instructorId: string) => void;
  onReset: () => void;
  onRefresh: () => void;
  onOpenConnectionModal: () => void;
  onExportExcel: () => void;
  isExporting?: boolean;
  exportFeedback?: { type: 'success' | 'error'; message: string } | null;
  metadata?: SheetMetadata | null;
  isLoading?: boolean;
  hasData?: boolean;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  selectedSemester,
  selectedInstructor,
  semesterOptions,
  instructorOptions,
  onSemesterChange,
  onInstructorChange,
  onReset,
  onRefresh,
  onOpenConnectionModal,
  onExportExcel,
  isExporting = false,
  exportFeedback = null,
  metadata,
  isLoading = false,
  hasData = false,
}) => {
  const isExportDisabled = !hasData || isLoading || isExporting || !selectedSemester || !selectedInstructor;

  return (
    <div 
      id="selection-filter-container"
      className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6 shadow-2xs"
    >
      {/* Top Status & Controls Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-medium text-slate-700">
            แหล่งข้อมูล: <strong className="text-slate-900">ENMSU_CoruseDatabase</strong>
          </span>
          {metadata && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 font-mono">
              {metadata.totalRows} แถว
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading || isExporting}
            title="รีเฟรชข้อมูลจาก Google Sheets"
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#800000]' : ''}`} />
            <span className="hidden sm:inline">รีเฟรชข้อมูล</span>
          </button>

          <button
            type="button"
            onClick={onOpenConnectionModal}
            title="จัดการการเชื่อมต่อ Google Apps Script"
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-[#fdf2f2] hover:bg-[#fae8e8] text-[#800000] text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>ตั้งค่าชีต</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        {/* Dropdowns Group */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          {/* Semester Selector */}
          <div className="flex flex-col gap-1.5">
            <label 
              htmlFor="semester-select"
              className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-[#800000]" />
              <span>ภาคเรียน / ปีการศึกษา</span>
            </label>
            <div className="relative">
              <select
                id="semester-select"
                value={selectedSemester}
                onChange={(e) => onSemesterChange(e.target.value)}
                disabled={isLoading || isExporting || semesterOptions.length === 0}
                className="w-full h-11 pl-3.5 pr-10 text-sm bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
              >
                <option value="">
                  {semesterOptions.length === 0
                    ? isLoading
                      ? '-- กำลังโหลดภาคเรียนจาก Google Sheets... --'
                      : '-- ไม่พบข้อมูลภาคเรียนในชีต --'
                    : '-- เลือกภาคเรียน --'}
                </option>
                {semesterOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Instructor Selector */}
          <div className="flex flex-col gap-1.5">
            <label 
              htmlFor="instructor-select"
              className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <User className="w-4 h-4 text-[#800000]" />
              <span>อาจารย์ผู้สอน</span>
            </label>
            <div className="relative">
              <select
                id="instructor-select"
                value={selectedInstructor}
                onChange={(e) => onInstructorChange(e.target.value)}
                disabled={!selectedSemester || isLoading || isExporting || instructorOptions.length === 0}
                className="w-full h-11 pl-3.5 pr-10 text-sm bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-colors cursor-pointer disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed appearance-none"
              >
                <option value="">
                  {!selectedSemester
                    ? '-- กรุณาเลือกภาคเรียนก่อน --'
                    : instructorOptions.length === 0
                      ? '-- ไม่พบอาจารย์ในภาคเรียนนี้ --'
                      : '-- เลือกอาจารย์ --'}
                </option>
                {instructorOptions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} {inst.courseCount !== undefined ? `(${inst.courseCount} กลุ่ม)` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 lg:pt-0">
          {(selectedSemester || selectedInstructor) && (
            <button
              id="reset-filter-btn"
              type="button"
              onClick={onReset}
              disabled={isLoading || isExporting}
              title="ล้างการเลือก"
              className="h-11 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">ล้างค่า</span>
            </button>
          )}

          {/* Export Excel Button (Milestone 4 Functional) */}
          <button
            id="export-excel-btn"
            type="button"
            onClick={onExportExcel}
            disabled={isExportDisabled}
            title={
              isExportDisabled
                ? !selectedSemester
                  ? 'กรุณาเลือกภาคเรียนก่อน'
                  : !selectedInstructor
                    ? 'กรุณาเลือกอาจารย์ผู้สอนก่อน'
                    : !hasData
                      ? 'ไม่มีข้อมูลรายวิชาสำหรับส่งออก'
                      : isExporting
                        ? 'กำลังสร้างไฟล์ Excel...'
                        : 'ส่งออกรายงาน Excel'
                : 'ส่งออกรายงานภาระงานสอนเป็นไฟล์ Excel (.xlsx)'
            }
            className="h-11 px-5 rounded-xl bg-[#1d6f42] hover:bg-[#165834] active:scale-[0.98] text-white text-sm font-medium inline-flex items-center justify-center gap-2 shadow-2xs transition-all disabled:opacity-40 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>กำลังสร้างไฟล์ Excel...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                <span>ส่งออก Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Notification / Feedback Banner */}
      {exportFeedback && (
        <div
          id="export-feedback-banner"
          className={`mt-4 p-3 rounded-xl flex items-center gap-2.5 text-xs font-medium transition-all ${
            exportFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {exportFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{exportFeedback.message}</span>
        </div>
      )}
    </div>
  );
};

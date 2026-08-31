import React from 'react';
import { BookOpen, AlertCircle } from 'lucide-react';
import { CourseRecord, UIState } from '../types';
import { TableRowSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { formatWorkload } from '../services/workloadCalculator';

interface CourseTableProps {
  courses: CourseRecord[];
  uiState: UIState;
  errorMessage?: string;
  onRetry?: () => void;
}

export const CourseTable: React.FC<CourseTableProps> = ({
  courses,
  uiState,
  errorMessage,
  onRetry,
}) => {
  const invalidCoursesCount = courses.filter(
    (c) => (c.workload === undefined || c.workload === null || isNaN(c.workload)) && !c.isExcluded
  ).length;

  const excludedCount = courses.filter((c) => c.isExcluded).length;

  return (
    <div 
      id="course-table-wrapper"
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
    >
      {/* Table Header / Title Bar */}
      <div className="px-5 py-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#fdf2f2] text-[#800000] flex items-center justify-center border border-[#f3d1d1]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              ตารางรายการรายวิชาและภาระงานสอน
            </h2>
            <p className="text-xs text-slate-500">
              สูตรคำนวณภาระงาน: (4 × หน่วยกิต × 7.5) ÷ จำนวนผู้สอน
            </p>
          </div>
        </div>

        {courses.length > 0 && uiState === 'loaded' && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
            {courses.length} กลุ่มเรียน
          </span>
        )}
      </div>

      {/* Non-blocking Warning Banner if some records are invalid or excluded */}
            {courses.length > 0 && uiState === 'loaded' && (invalidCoursesCount > 0 || excludedCount > 0) && (
              <div className="px-5 py-2.5 bg-amber-50/80 border-b border-amber-100 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  พบ <strong>{invalidCoursesCount}</strong> รายการที่ไม่สามารถคำนวณภาระงานได้เนื่องจากไม่พบหน่วยกิตหรือจำนวนผู้สอน
                  (ระบบแสดงเครื่องหมาย <strong>—</strong> และยกเว้นจากการคำนวณยอดรวม)
                </span>
                {excludedCount > 0 && (
                  <span className="ml-2 text-slate-500">
                    — {excludedCount} รายการโครงงาน/วิทยานิพนธ์ (ภาระงาน = 0)
                  </span>
                )}
              </div>
            )}

      {/* Main Content / Table Area */}
      {uiState === 'initial' && (
        <div className="p-6">
          <EmptyState type="initial" />
        </div>
      )}

      {uiState === 'empty' && (
        <div className="p-6">
          <EmptyState type="no-data" />
        </div>
      )}

      {uiState === 'error' && (
        <div className="p-6">
          <ErrorState 
            message={errorMessage || "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง"} 
            onRetry={onRetry} 
          />
        </div>
      )}

      {(uiState === 'loading' || (uiState === 'loaded' && courses.length > 0)) && (
        <div className="overflow-x-auto">
          <table 
            id="course-workload-table"
            className="w-full text-left text-sm border-collapse min-w-[760px]"
          >
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 text-xs">
                <th className="py-3.5 px-4 w-28 text-left">รหัสวิชา</th>
                <th className="py-3.5 px-4 min-w-[200px] text-left">รายวิชา</th>
                <th className="py-3.5 px-4 w-24 text-center">หน่วยกิต</th>
                <th className="py-3.5 px-4 w-16 text-center">กลุ่ม</th>
                <th className="py-3.5 px-4 w-24 text-center">วัน</th>
                <th className="py-3.5 px-4 w-28 text-center">เวลา</th>
                <th className="py-3.5 px-4 w-24 text-center">จำนวนนิสิต</th>
                <th className="py-3.5 px-4 w-24 text-center">จำนวนผู้สอน</th>
                <th className="py-3.5 px-4 w-28 text-right font-bold text-[#800000]">ภาระงาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {uiState === 'loading' ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : (
                courses.map((course) => {
                  const hasValidWorkload = course.workload !== undefined && course.workload !== null && !isNaN(course.workload);

                  return (
                    <tr 
                      key={course.id} 
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        {course.courseCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{course.courseName}</div>
                        {course.teachingType && (
                          <span className="inline-block mt-0.5 text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {course.teachingType}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {course.creditText}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium">
                        {course.section}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {course.day}
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs font-mono">
                        {course.time}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {course.studentCount}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {course.instructorCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#800000]">
                        {hasValidWorkload ? (
                          <span>{formatWorkload(course.workload)}</span>
                        ) : (
                          <span 
                            className="text-slate-400 font-normal cursor-help"
                            title={course.workloadError || "ไม่สามารถคำนวณได้"}
                          >
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

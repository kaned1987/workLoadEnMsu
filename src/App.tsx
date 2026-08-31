import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { FilterSection } from './components/FilterSection';
import { SummaryCards } from './components/SummaryCards';
import { CourseTable } from './components/CourseTable';
import { ConnectionModal } from './components/ConnectionModal';
import { Footer } from './components/Footer';
import {
  SemesterOption,
  InstructorOption,
  CourseRecord,
  DashboardSummary,
  UIState,
  SheetMetadata,
  DataMappingField,
} from './types';
import {
  getSemesters,
  getInstructors,
  getCourses,
  getMetadata,
  getActiveAppsScriptUrl,
} from './services/appsScriptService';
import { generateMappingFields } from './services/sheetDataMapper';
import { calculateTotalWorkload } from './services/workloadCalculator';
import { exportTeachingWorkloadToExcel } from './services/excelExportService';
import { Database, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export default function App() {
  // Selection state
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');

  // UI state & error management
  const [uiState, setUiState] = useState<UIState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Live options and courses from Google Sheets
  const [semesterOptions, setSemesterOptions] = useState<SemesterOption[]>([]);
  const [instructorOptions, setInstructorOptions] = useState<InstructorOption[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [metadata, setMetadata] = useState<SheetMetadata | null>(null);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // 1. Initial load: fetch semesters and sheet metadata from Apps Script Web App
  const initSemesters = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setUiState('loading');
    }
    setIsRefreshing(true);
    setErrorMessage('');

    try {
      const [fetchedSemesters, fetchedMeta] = await Promise.all([
        getSemesters(),
        getMetadata(),
      ]);

      setSemesterOptions(fetchedSemesters);
      setMetadata(fetchedMeta);

      if (fetchedSemesters.length === 0) {
        setUiState('empty');
      } else {
        setUiState('initial');
      }
    } catch (err: any) {
      console.error('Failed to load semesters from Apps Script:', err);
      setErrorMessage(
        err.message || 'ไม่สามารถเชื่อมต่อ Google Sheets (ENMSU_CoruseDatabase) ได้'
      );
      setUiState('error');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    initSemesters();
  }, [initSemesters]);

  // 2. When Semester changes: fetch instructors for the selected semester
  const handleSemesterChange = useCallback(async (semesterId: string) => {
    setSelectedSemester(semesterId);
    setSelectedInstructor('');
    setCourses([]);
    setInstructorOptions([]);
    setErrorMessage('');

    if (!semesterId) {
      setUiState('initial');
      return;
    }

    setUiState('loading');
    try {
      const fetchedInstructors = await getInstructors(semesterId);
      setInstructorOptions(fetchedInstructors);
      setUiState('initial');
    } catch (err: any) {
      console.error(`Failed to load instructors for semester ${semesterId}:`, err);
      setErrorMessage(
        err.message || `ไม่สามารถโหลดรายชื่ออาจารย์สำหรับภาคเรียน ${semesterId} ได้`
      );
      setUiState('error');
    }
  }, []);

  // 3. When Instructor changes: fetch courses for selected semester & instructor
  const handleInstructorChange = useCallback(
    async (instructorName: string) => {
      setSelectedInstructor(instructorName);
      setErrorMessage('');

      if (!instructorName || !selectedSemester) {
        setCourses([]);
        setUiState('initial');
        return;
      }

      setUiState('loading');
      try {
        const fetchedCourses = await getCourses(selectedSemester, instructorName);
        setCourses(fetchedCourses);

        if (fetchedCourses.length === 0) {
          setUiState('empty');
        } else {
          setUiState('loaded');
        }
      } catch (err: any) {
        console.error(`Failed to load courses for ${instructorName}:`, err);
        setErrorMessage(
          err.message || `ไม่สามารถโหลดข้อมูลรายวิชาของ ${instructorName} ได้`
        );
        setUiState('error');
      }
    },
    [selectedSemester]
  );

  // 4. Compute Dashboard Summary Cards from real returned records
  const summary: DashboardSummary = useMemo(() => {
    if (!selectedSemester || !selectedInstructor || courses.length === 0) {
      return {
        courseCount: null,
        sectionCount: null,
        coInstructorCount: null,
        totalWorkload: null,
      };
    }

    // 1. รายวิชาที่สอน (Distinct course codes)
    const uniqueCourseCodes = new Set(courses.map((c) => c.courseCode).filter((code) => code && code !== '—'));

    // 2. กลุ่มเรียน (Total section records returned)
    const totalSections = courses.length;

    // 3. จำนวนผู้สอนร่วม (Distinct co-instructors teaching with the selected instructor)
    const distinctCoInstructors = new Set<string>();
    courses.forEach((c) => {
      if (c.coInstructors && Array.isArray(c.coInstructors)) {
        c.coInstructors.forEach((co) => {
          if (co && co !== '—' && co.toLowerCase() !== selectedInstructor.toLowerCase()) {
            distinctCoInstructors.add(co);
          }
        });
      }
    });

    // 4. ภาระงานรวม (Sum of all valid calculated workload values)
    const totalWorkloadResult = calculateTotalWorkload(courses);

    return {
      courseCount: uniqueCourseCodes.size,
      sectionCount: totalSections,
      coInstructorCount: distinctCoInstructors.size,
      totalWorkload: totalWorkloadResult.totalWorkload,
      invalidWorkloadCount: totalWorkloadResult.invalidCount,
    };
  }, [selectedSemester, selectedInstructor, courses]);

  // 5. Handle Reset Action
  const handleReset = useCallback(() => {
    setSelectedSemester('');
    setSelectedInstructor('');
    setCourses([]);
    setInstructorOptions([]);
    setErrorMessage('');
    setExportFeedback(null);
    setUiState('initial');
  }, []);

  // 6. Handle Retry Action
  const handleRetry = useCallback(() => {
    if (selectedSemester && selectedInstructor) {
      handleInstructorChange(selectedInstructor);
    } else if (selectedSemester) {
      handleSemesterChange(selectedSemester);
    } else {
      initSemesters();
    }
  }, [selectedSemester, selectedInstructor, handleInstructorChange, handleSemesterChange, initSemesters]);

  // 7. Handle Export Excel (Milestone 4)
  const handleExportExcel = useCallback(async () => {
    // Duplicate click protection
    if (isExporting) return;

    if (!selectedSemester || !selectedInstructor || courses.length === 0) {
      setExportFeedback({
        type: 'error',
        message: 'กรุณาเลือกภาคเรียนและอาจารย์ผู้สอนก่อนทำการส่งออก Excel',
      });
      return;
    }

    setIsExporting(true);
    setExportFeedback(null);

    try {
      const result = await exportTeachingWorkloadToExcel({
        semester: selectedSemester,
        instructor: selectedInstructor,
        courses,
        summary,
      });

      if (result.success) {
        setExportFeedback({
          type: 'success',
          message: `ส่งออก Excel สำเร็จ (${result.filename})`,
        });

        // Automatically clear success message after 4 seconds
        setTimeout(() => {
          setExportFeedback((curr) => (curr?.type === 'success' ? null : curr));
        }, 4000);
      } else {
        setExportFeedback({
          type: 'error',
          message: result.error || 'ไม่สามารถส่งออกไฟล์ Excel ได้ กรุณาลองใหม่',
        });
      }
    } catch (err: any) {
      console.error('Export Excel failed:', err);
      setExportFeedback({
        type: 'error',
        message: 'ไม่สามารถส่งออกไฟล์ Excel ได้ กรุณาลองใหม่',
      });
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, selectedSemester, selectedInstructor, courses, summary]);

  // 8. Generate data mapping fields for modal
  const mappingFields: DataMappingField[] = useMemo(() => {
    const headers = metadata?.headers || [];
    const dummyMapping: Record<string, string> = {
      semester: 'ภาคเรียน/ปีการศึกษา',
      courseCode: 'รหัสวิชา',
      courseName: 'ชื่อวิชา',
      creditText: 'หน่วยกิต',
      section: 'กลุ่ม',
      day: 'เวลาเรียน (วัน)',
      time: 'เวลาเรียน (เวลา)',
      studentCount: 'ลง (จำนวนนิสิต)',
      instructors: 'ผู้สอน',
      numberOfInstructors: 'ผู้สอน (คำนวณอัตโนมัติ)',
      teachingType: 'ประเภทวิชา',
    };
    return generateMappingFields(headers, dummyMapping);
  }, [metadata]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-[#800000] selection:text-white">
      {/* 1. Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Milestone 2 Status & Integration Indicator Banner */}
        <div
          id="milestone-indicator"
          className="mb-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold bg-[#800000] text-white text-[11px]">
                  Milestone 2
                </span>
                <span className="font-bold text-slate-800">
                  Google Sheets Data Integration (ENMSU_CoruseDatabase)
                </span>
              </div>
              <p className="text-slate-500 mt-0.5">
                {metadata ? (
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                    <span>
                      เชื่อมต่อชีตจริง: <strong>{metadata.spreadsheetName}</strong> ({semesterOptions.length} ภาคเรียนในระบบ)
                    </span>
                  </span>
                ) : (
                  <span>สถาปัตยกรรม: Web App → Google Apps Script → Google Sheets</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsConnectionModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-[#800000]" />
              <span>ดูข้อมูลชีต & การจับคู่</span>
            </button>
          </div>
        </div>

        {/* 2. Selection / Filter Section */}
        <FilterSection
          selectedSemester={selectedSemester}
          selectedInstructor={selectedInstructor}
          semesterOptions={semesterOptions}
          instructorOptions={instructorOptions}
          onSemesterChange={handleSemesterChange}
          onInstructorChange={handleInstructorChange}
          onReset={handleReset}
          onRefresh={() => {
            if (selectedSemester && selectedInstructor) {
              handleInstructorChange(selectedInstructor);
            } else if (selectedSemester) {
              handleSemesterChange(selectedSemester);
            } else {
              initSemesters(false);
            }
          }}
          onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
          onExportExcel={handleExportExcel}
          isExporting={isExporting}
          exportFeedback={exportFeedback}
          metadata={metadata}
          isLoading={isRefreshing || uiState === 'loading'}
          hasData={courses.length > 0 && uiState === 'loaded'}
        />

        {/* 3. Dashboard Summary Cards */}
        <SummaryCards
          summary={summary}
          isLoading={uiState === 'loading'}
        />

        {/* 4. Course Data Table */}
        <CourseTable
          courses={courses}
          uiState={uiState}
          errorMessage={errorMessage}
          onRetry={handleRetry}
        />
      </main>

      {/* 5. Google Sheets / Apps Script Connection Modal */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onRefreshData={() => initSemesters(false)}
        metadata={metadata}
        mappingFields={mappingFields}
      />

      {/* 6. Footer */}
      <Footer />
    </div>
  );
}

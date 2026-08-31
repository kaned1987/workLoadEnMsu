import * as XLSX from 'xlsx';
import { CourseRecord, DashboardSummary } from '../types';

export interface ExportExcelOptions {
  semester: string;
  instructor: string;
  courses: CourseRecord[];
  summary: DashboardSummary;
  exportDate?: Date;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  error?: string;
}

/**
 * Formats a Date object into a readable Thai date and time string.
 * Example: "31 สิงหาคม 2569 เวลา 14:30 น."
 */
export function formatThaiDateTime(date: Date = new Date()): string {
  const thaiMonths = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];

  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const thaiYear = date.getFullYear() + 543;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${thaiYear} เวลา ${hours}:${minutes} น.`;
}

/**
 * Sanitizes strings for safe, cross-platform file naming.
 */
export function sanitizeFilename(str: string): string {
  if (!str) return 'unknown';
  return str
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

/**
 * Generates the standardized filename according to specifications.
 * Example: "TeachingWorkload_1_2569_ผศ.ดร.คเณศ_ถุงออด.xlsx"
 */
export function generateExportFilename(semester: string, instructor: string): string {
  const safeSemester = sanitizeFilename(semester || 'semester');
  const safeInstructor = sanitizeFilename(instructor || 'instructor');
  return `TeachingWorkload_${safeSemester}_${safeInstructor}.xlsx`;
}

/**
 * Builds the Workbook object containing the "ภาระงานสอน" worksheet
 * with all Report Info, Summary, Course Table rows, and Total Row.
 */
export function createTeachingWorkloadWorkbook(options: ExportExcelOptions): XLSX.WorkBook {
  const { semester, instructor, courses, summary, exportDate = new Date() } = options;

  const aoa: any[][] = [];

  // ==========================================
  // SECTION 1 — REPORT INFORMATION
  // ==========================================
  aoa.push(['ระบบคำนวณภาระงานสอน']);
  aoa.push(['คณะวิศวกรรมศาสตร์ มหาวิทยาลัยมหาสารคาม']);
  aoa.push([]); // blank row

  aoa.push(['ภาคเรียน / ปีการศึกษา', semester]);
  aoa.push(['อาจารย์ผู้สอน', instructor]);
  aoa.push(['วันที่ส่งออก', formatThaiDateTime(exportDate)]);
  aoa.push([]); // blank row

  // ==========================================
  // OPTIONAL / DASHBOARD SUMMARY SECTION
  // ==========================================
  aoa.push(['สรุปภาพรวม']);
  aoa.push(['จำนวนรายวิชา', summary.courseCount ?? 0, 'วิชา']);
  aoa.push(['จำนวนกลุ่มเรียน', summary.sectionCount ?? 0, 'กลุ่ม']);
  aoa.push(['จำนวนผู้สอนร่วม', summary.coInstructorCount ?? 0, 'ท่าน']);
  aoa.push([
    'ภาระงานรวม',
    summary.totalWorkload !== null && !isNaN(summary.totalWorkload)
      ? Number(summary.totalWorkload)
      : '—',
    'ชม./สัปดาห์',
  ]);
  aoa.push([]); // blank row

  // ==========================================
  // SECTION 2 — COURSE DATA TABLE
  // ==========================================
  // Table Header (10 columns strictly ordered)
  aoa.push([
    'ลำดับ',
    'รหัสวิชา',
    'รายวิชา',
    'หน่วยกิต',
    'กลุ่ม',
    'วัน',
    'เวลา',
    'จำนวนนิสิต',
    'จำนวนผู้สอน',
    'ภาระงาน',
  ]);

  // Data Rows
  courses.forEach((course, index) => {
    // Parse numeric student count if possible
    let studentCountVal: number | string = course.studentCount;
    if (typeof course.studentCount === 'number') {
      studentCountVal = course.studentCount;
    } else {
      const parsed = parseInt(String(course.studentCount).trim(), 10);
      if (!isNaN(parsed)) {
        studentCountVal = parsed;
      }
    }

    // Workload cell value: 0 for Project/Thesis, exact numeric for normal courses, '—' for errors
        let workloadVal: number | string = '—';
        if (course.isExcluded) {
          workloadVal = 0; // Project/Thesis: show 0
        } else if (
      course.workload !== undefined &&
      course.workload !== null &&
      !isNaN(course.workload) &&
      isFinite(course.workload)
    ) {
      workloadVal = Number(course.workload);
    }

    aoa.push([
      index + 1,
      course.courseCode || '—',
      course.courseName || '—',
      course.creditText || (course.creditNumber ? String(course.creditNumber) : '—'),
      course.section || '—',
      course.day || '—',
      course.time || '—',
      studentCountVal,
      course.instructorCount ?? 1,
      workloadVal,
    ]);
  });

  // ==========================================
  // TOTAL ROW
  // ==========================================
  const totalWorkloadVal: number | string =
    summary.totalWorkload !== null &&
    summary.totalWorkload !== undefined &&
    !isNaN(summary.totalWorkload) &&
    isFinite(summary.totalWorkload)
      ? Number(summary.totalWorkload)
      : '—';

  aoa.push([
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'ภาระงานรวม',
    totalWorkloadVal,
  ]);

  // Create worksheet from AOA
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Configure Column Widths for clean display & printability
  ws['!cols'] = [
    { wch: 8 },  // 1. ลำดับ
    { wch: 14 }, // 2. รหัสวิชา
    { wch: 38 }, // 3. รายวิชา
    { wch: 14 }, // 4. หน่วยกิต
    { wch: 8 },  // 5. กลุ่ม
    { wch: 10 }, // 6. วัน
    { wch: 18 }, // 7. เวลา
    { wch: 14 }, // 8. จำนวนนิสิต
    { wch: 14 }, // 9. จำนวนผู้สอน
    { wch: 16 }, // 10. ภาระงาน
  ];

  // Set number formats for numeric cells where applicable
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:J1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (cell && cell.t === 'n') {
        // Apply clean number formatting without unnecessary trailing zeros
        cell.z = '0.##';
      }
    }
  }

  // Create Workbook & append worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ภาระงานสอน');

  return wb;
}

/**
 * Validates export prerequisites before generating file.
 */
export function validateExportState(
  semester: string,
  instructor: string,
  courses: CourseRecord[]
): { isValid: boolean; error?: string } {
  if (!semester || semester.trim() === '') {
    return { isValid: false, error: 'กรุณาเลือกภาคเรียนก่อนส่งออกไฟล์' };
  }
  if (!instructor || instructor.trim() === '') {
    return { isValid: false, error: 'กรุณาเลือกอาจารย์ผู้สอนก่อนส่งออกไฟล์' };
  }
  if (!courses || courses.length === 0) {
    return { isValid: false, error: 'ไม่พบรายการรายวิชาสำหรับอาจารย์และภาคเรียนที่เลือก' };
  }

  return { isValid: true };
}

/**
 * Client-side trigger for downloading the workbook as .xlsx in browser.
 */
export async function exportTeachingWorkloadToExcel(
  options: ExportExcelOptions
): Promise<ExportResult> {
  const validation = validateExportState(options.semester, options.instructor, options.courses);
  if (!validation.isValid) {
    return {
      success: false,
      filename: '',
      error: validation.error || 'ข้อมูลไม่พร้อมสำหรับการส่งออก',
    };
  }

  try {
    const filename = generateExportFilename(options.semester, options.instructor);
    const wb = createTeachingWorkloadWorkbook(options);

    // Generate binary array buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    // Browser file download trigger
    if (typeof window !== 'undefined' && window.document) {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    }

    return {
      success: true,
      filename,
    };
  } catch (err: any) {
    console.error('Error generating Excel file:', err);
    return {
      success: false,
      filename: '',
      error: err.message || 'ไม่สามารถส่งออกไฟล์ Excel ได้ กรุณาลองใหม่',
    };
  }
}

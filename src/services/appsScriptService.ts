import {
  AppsScriptResponse,
  CourseRecord,
  DashboardSummary,
  InstructorOption,
  SemesterOption,
  SheetMetadata,
} from '../types';
import { parseInstructorNames, mergeDuplicateCourseRecords } from './sheetDataMapper';
import { calculateTeachingWorkload, parseMainCredit } from './workloadCalculator';

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyNaVYZee1gbnU2yIDYJ4xq936MUgKuypK5fg6GmgQ5R4A73fGHGvH9jRoWGGpIfeD9hw/exec';

const STORAGE_KEY_APPS_SCRIPT_URL = 'ENMSU_APPS_SCRIPT_URL';

/**
 * Cache of raw instructor string entries per semester returned by Apps Script
 */
const semesterRawInstructorsCache = new Map<string, string[]>();

/**
 * Get active Google Apps Script Web App URL from environment, localStorage or default
 */
export function getActiveAppsScriptUrl(): string {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem(STORAGE_KEY_APPS_SCRIPT_URL);
    if (customUrl && customUrl.trim() !== '') {
      return customUrl.trim();
    }
  }

  const envUrl =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_APPS_SCRIPT_URL
      : typeof process !== 'undefined'
        ? process.env.VITE_APPS_SCRIPT_URL
        : undefined;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim();
  }

  return DEFAULT_APPS_SCRIPT_URL;
}

/**
 * Save custom Google Apps Script Web App URL in localStorage
 */
export function setActiveAppsScriptUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || url.trim() === '' || url.trim() === DEFAULT_APPS_SCRIPT_URL) {
      localStorage.removeItem(STORAGE_KEY_APPS_SCRIPT_URL);
    } else {
      localStorage.setItem(STORAGE_KEY_APPS_SCRIPT_URL, url.trim());
    }
  }
}

/**
 * Helper to build safe API URLs with query params
 */
function buildApiUrl(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

/**
 * Helper to parse schedule into Thai day string and readable time
 */
export function parseScheduleToDayTime(schedule?: string): { day: string; time: string } {
  if (!schedule || typeof schedule !== 'string' || schedule.trim() === '' || schedule.trim() === '-') {
    return { day: '—', time: '—' };
  }

  const DAY_MAP: Record<string, string> = {
    Mo: 'จันทร์',
    Tu: 'อังคาร',
    We: 'พุธ',
    Th: 'พฤหัสบดี',
    Fr: 'ศุกร์',
    Sa: 'เสาร์',
    Su: 'อาทิตย์',
  };

  const parts = schedule.split('|').map((s) => s.trim()).filter(Boolean);
  const days: string[] = [];
  const times: string[] = [];

  for (const part of parts) {
    const match = part.match(/^(Mo|Tu|We|Th|Fr|Sa|Su)?\s*(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})?(.*)$/i);
    if (match) {
      const dCode = match[1];
      const tCode = match[2];
      const room = match[3] ? match[3].trim() : '';

      if (dCode) {
        const dThai = DAY_MAP[dCode] || dCode;
        if (!days.includes(dThai)) days.push(dThai);
      }
      if (tCode) {
        const timeStr = room ? `${tCode} (${room})` : tCode;
        if (!times.includes(timeStr)) times.push(timeStr);
      } else if (part) {
        if (!times.includes(part)) times.push(part);
      }
    } else {
      if (!times.includes(part)) times.push(part);
    }
  }

  return {
    day: days.length > 0 ? days.join(', ') : '—',
    time: times.length > 0 ? times.join(' | ') : '—',
  };
}

/**
 * Centralized safe JSON fetcher for Google Apps Script Web App
 */
async function fetchFromAppsScript<T>(params: Record<string, string>, customBaseUrl?: string): Promise<T> {
  const baseUrl = (customBaseUrl || getActiveAppsScriptUrl()).trim();
  if (!baseUrl) {
    throw new Error('ยังไม่ได้กำหนด URL ของ Google Apps Script Web App สำหรับเชื่อมต่อกับ ENMSU_CoruseDatabase');
  }

  const fullUrl = buildApiUrl(baseUrl, params);

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (netErr: any) {
    console.error('Apps Script Network Error:', netErr);
    throw new Error('ไม่สามารถเชื่อมต่อ Google Apps Script Web App ได้ (Network or CORS issue)');
  }

  if (!response.ok) {
    throw new Error(`Google Apps Script ตอบกลับรหัสผิดพลาด: HTTP ${response.status} ${response.statusText}`);
  }

  let data: any;
  try {
    data = await response.json();
  } catch (jsonErr) {
    console.error('Failed to parse JSON response from Apps Script:', jsonErr);
    throw new Error('รูปแบบข้อมูลตอบกลับจาก Google Apps Script ไม่ถูกต้อง (Invalid JSON)');
  }

  if (data && data.success === false) {
    throw new Error(data.error || data.message || 'Google Apps Script รายงานข้อผิดพลาด');
  }

  return data as T;
}

/**
 * 1. Fetch available semesters from Google Apps Script
 */
export async function getSemesters(overrideUrl?: string): Promise<SemesterOption[]> {
  const data = await fetchFromAppsScript<{ success: boolean; semesters?: (string | SemesterOption)[]; count?: number }>(
    { action: 'getSemesters' },
    overrideUrl
  );

  if (!data || !Array.isArray(data.semesters)) {
    return [];
  }

  const result: SemesterOption[] = [];
  const seen = new Set<string>();

  data.semesters.forEach((sem) => {
    const semId = typeof sem === 'string' ? sem.trim() : sem.id || sem.label || '';
    if (!semId || seen.has(semId)) return;
    seen.add(semId);

    const parts = semId.split('/');
    const term = parts.length === 2 ? parts[0].trim() : '';
    const year = parts.length === 2 ? parts[1].trim() : '';

    result.push({
      id: semId,
      label: `ภาคเรียนที่ ${semId}`,
      academicYear: year,
      term: term,
    });
  });

  // Sort descending by academic year and term
  result.sort((a, b) => {
    if (a.academicYear && b.academicYear && a.academicYear !== b.academicYear) {
      return b.academicYear.localeCompare(a.academicYear, 'th', { numeric: true });
    }
    if (a.term && b.term) {
      return b.term.localeCompare(a.term, 'th', { numeric: true });
    }
    return b.id.localeCompare(a.id, 'th', { numeric: true });
  });

  return result;
}

/**
 * 2. Fetch instructors for a specific semester from Google Apps Script
 */
export async function getInstructors(semester: string, overrideUrl?: string): Promise<InstructorOption[]> {
  if (!semester) return [];

  const data = await fetchFromAppsScript<{
    success: boolean;
    semester?: string;
    count?: number;
    instructors?: Array<{ name: string; courseCount?: number; sectionCount?: number } | string>;
  }>({ action: 'getInstructors', semester }, overrideUrl);

  if (!data || !Array.isArray(data.instructors)) {
    return [];
  }

  // Cache raw string names from Apps Script for this semester
  const rawList: string[] = [];
  data.instructors.forEach((item) => {
    const rawName = typeof item === 'string' ? item : item.name;
    if (rawName && rawName.trim() !== '' && rawName.trim() !== '—') {
      rawList.push(rawName.trim());
    }
  });
  semesterRawInstructorsCache.set(semester, rawList);

  // Deduplicate and parse individual instructor names if joint names exist
  const instructorMap = new Map<string, { name: string; sectionCount: number }>();

  data.instructors.forEach((item) => {
    const rawName = typeof item === 'string' ? item : item.name;
    const count = typeof item === 'object' && item.sectionCount ? item.sectionCount : 1;

    if (!rawName || rawName.trim() === '' || rawName.trim() === '—') return;

    // Support both the exact entry as well as individual split names
    const names = parseInstructorNames(rawName);
    if (names.length === 0) {
      names.push(rawName.trim());
    }

    names.forEach((name) => {
      const trimmed = name.trim();
      if (!trimmed || trimmed === '—') return;
      const existing = instructorMap.get(trimmed);
      if (existing) {
        existing.sectionCount += count;
      } else {
        instructorMap.set(trimmed, { name: trimmed, sectionCount: count });
      }
    });
  });

  const list: InstructorOption[] = Array.from(instructorMap.values()).map((inst) => ({
    id: inst.name,
    name: inst.name,
    courseCount: inst.sectionCount,
  }));

  // Sort Thai alphabetically
  list.sort((a, b) => a.name.localeCompare(b.name, 'th'));

  return list;
}

/**
 * 3. Fetch courses for a specific semester & instructor from Google Apps Script
 * 
 * Includes:
 * - Querying both exact instructor names and joint multi-instructor entries
 * - Merging duplicate normal/transfer system course rows by semester + courseCode + section
 * - Calculating instructor counts and workload on merged records
 */
export async function getCourses(
  semester: string,
  instructor: string,
  overrideUrl?: string
): Promise<CourseRecord[]> {
  if (!semester || !instructor) return [];

  // Ensure raw instructor cache is populated
  let rawList = semesterRawInstructorsCache.get(semester);
  if (!rawList || rawList.length === 0) {
    try {
      await getInstructors(semester, overrideUrl);
      rawList = semesterRawInstructorsCache.get(semester) || [];
    } catch {
      rawList = [];
    }
  }

  // Find all raw entries in Google Sheets that include this instructor
  const matchingRawTargets = new Set<string>();
  matchingRawTargets.add(instructor);

  rawList.forEach((raw) => {
    const parsed = parseInstructorNames(raw);
    if (
      parsed.includes(instructor) ||
      parsed.some((p) => p.toLowerCase() === instructor.toLowerCase()) ||
      raw.includes(instructor)
    ) {
      matchingRawTargets.add(raw);
    }
  });

  // Query Apps Script for all matching raw instructor entries in parallel
  const rawResults = await Promise.all(
    Array.from(matchingRawTargets).map(async (targetName) => {
      try {
        const res = await fetchFromAppsScript<{
          success: boolean;
          semester?: string;
          instructor?: string;
          count?: number;
          records?: any[];
          courses?: any[];
        }>({ action: 'getCourses', semester, instructor: targetName }, overrideUrl);

        return Array.isArray(res.records)
          ? res.records
          : Array.isArray(res.courses)
            ? res.courses
            : [];
      } catch (err) {
        console.warn(`Failed to fetch courses for "${targetName}":`, err);
        return [];
      }
    })
  );

  // Flatten all raw records retrieved
  const rawRecords = rawResults.flat();

  // Map into unmerged CourseRecord array
  const unmergedList: CourseRecord[] = rawRecords.map((r, index) => {
    // Collect all raw instructor information
    const rawInstructorSource = [
      ...(Array.isArray(r.instructors) ? r.instructors : r.instructors ? [r.instructors] : []),
      r.instructorText,
    ].filter(Boolean);

    const instructorsList: string[] = parseInstructorNames(rawInstructorSource);

    // Number of instructors: prioritize actual count of instructors separated by |
    let instructorCount = instructorsList.length > 0 ? instructorsList.length : 1;
    if (r.numberOfInstructors !== undefined && r.numberOfInstructors !== null && r.numberOfInstructors !== '') {
      const parsedNum = typeof r.numberOfInstructors === 'number' ? r.numberOfInstructors : parseInt(String(r.numberOfInstructors), 10);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        if (instructorsList.length <= 1 || parsedNum > instructorsList.length) {
          instructorCount = parsedNum;
        }
      }
    }

    const instructorText = instructorsList.length > 0 ? instructorsList.join(' | ') : (r.instructorText || (Array.isArray(r.instructors) ? r.instructors.join(' | ') : r.instructors || '—'));

    const coInstructors = instructorsList.filter(
      (name) => name.toLowerCase() !== instructor.toLowerCase() && !instructor.includes(name) && !name.includes(instructor)
    );

    // Schedule handling
    const scheduleStr = r.schedule || '';
    const parsedSchedule = parseScheduleToDayTime(scheduleStr);
    const day = r.day && r.day !== '—' ? r.day : parsedSchedule.day;
    const time = r.time && r.time !== '—' ? r.time : parsedSchedule.time;

    // Student count parsing
    let studentCount = 0;
    if (r.studentCount !== undefined && r.studentCount !== null && r.studentCount !== '') {
      const parsed = typeof r.studentCount === 'number' ? r.studentCount : parseInt(String(r.studentCount).replace(/,/g, ''), 10);
      if (!isNaN(parsed)) studentCount = parsed;
    }

    // Credit extraction
    const creditText = r.creditText || (r.credit ? String(r.credit) : '—');
    const creditNumber = typeof r.credit === 'number' && r.credit > 0 ? r.credit : (parseMainCredit(creditText) ?? undefined);

    // Initial workload calculation
    const workloadResult = calculateTeachingWorkload(creditNumber ?? creditText, instructorCount);

    return {
      id: r.id || `raw-course-${index + 1}-${r.courseCode || 'code'}-${r.section || '1'}`,
      semester: r.semester || semester,
      courseCode: r.courseCode || '—',
      courseName: r.courseName || '—',
      creditText: creditText,
      creditNumber: creditNumber,
      section: r.section || '—',
      day: day,
      time: time,
      studentCount: studentCount,
      instructorCount: instructorCount,
      instructorText: instructorText,
      instructors: instructorsList.length > 0 ? instructorsList : [instructorText],
      coInstructors: coInstructors,
      workload: workloadResult.isValid && workloadResult.workload !== null ? workloadResult.workload : undefined,
      workloadError: !workloadResult.isValid ? workloadResult.errorMessage : undefined,
      teachingType: r.teachingType || '—',
      rawRowIndex: index + 1,
    };
  });

  // Apply composite-key merging (semester + courseCode + section)
  const mergedRecords = mergeDuplicateCourseRecords(unmergedList, instructor);

  // Sort logically by course code and section
  mergedRecords.sort((a, b) => {
    const codeCompare = (a.courseCode || '').localeCompare(b.courseCode || '', 'th', { numeric: true });
    if (codeCompare !== 0) return codeCompare;
    return (a.section || '').localeCompare(b.section || '', 'th', { numeric: true });
  });

  return mergedRecords;
}

/**
 * 4. Get metadata for diagnostics and connection modal
 */
export async function getMetadata(semester?: string, overrideUrl?: string): Promise<SheetMetadata> {
  try {
    const params: Record<string, string> = { action: 'getMetadata' };
    if (semester) params.semester = semester;

    const data = await fetchFromAppsScript<{
      success: boolean;
      spreadsheet?: string;
      semesterTabs?: Array<{
        semester: string;
        sourceTab: string;
        headerRow: number;
        headers: string[];
      }>;
    }>(params, overrideUrl);

    const tabs = (data.semesterTabs || []).map((t) => t.sourceTab || t.semester);
    const firstTab = data.semesterTabs && data.semesterTabs[0];

    return {
      spreadsheetName: data.spreadsheet || 'ENMSU_CoruseDatabase',
      tabNames: tabs.length > 0 ? tabs : ['1/2569', '2/2569'],
      activeTab: firstTab ? firstTab.sourceTab : '1/2569',
      totalRows: 0,
      headers: firstTab && firstTab.headers ? firstTab.headers : [],
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    return {
      spreadsheetName: 'ENMSU_CoruseDatabase',
      tabNames: ['1/2569', '2/2569'],
      activeTab: '1/2569',
      totalRows: 0,
      headers: [
        'รหัสวิชา',
        'ชื่อวิชา',
        'ผู้สอน',
        'หน่วยกิต',
        'เวลาเรียน',
        'เวลาสอบ',
        'กลุ่ม',
        'รับ',
        'ลง',
        'เหลือ',
        'จอง',
        'หมายเหตุ',
      ],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * 5. Ping test for Google Apps Script Web App connection test
 */
export async function testAppsScriptConnection(url: string): Promise<{
  success: boolean;
  message: string;
  spreadsheetName?: string;
}> {
  if (!url || url.trim() === '') {
    return { success: false, message: 'กรุณาระบุ URL ของ Google Apps Script Web App' };
  }

  try {
    const urlObj = new URL(url.trim());
    urlObj.searchParams.set('action', 'ping');

    const res = await fetch(urlObj.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return {
        success: false,
        message: `HTTP Error: ${res.status} ${res.statusText}`,
      };
    }

    const json = await res.json();
    if (json.success) {
      return {
        success: true,
        message: 'เชื่อมต่อสำเร็จกับชีต: ' + (json.spreadsheetName || 'ENMSU_CoruseDatabase'),
        spreadsheetName: json.spreadsheetName,
      };
    } else {
      return {
        success: false,
        message: json.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'ไม่สามารถติดต่อ Web App ได้ (กรุณาตรวจสอบสิทธิ์และ URL)',
    };
  }
}

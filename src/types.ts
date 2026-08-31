/**
 * Type definitions for Teaching Workload Calculation Application
 * Faculty of Engineering, Mahasarakham University (EN MSU)
 */

export interface SemesterOption {
  id: string;
  label: string;
  academicYear: string;
  term: string;
}

export interface InstructorOption {
  id: string;
  name: string;
  department?: string;
  courseCount?: number;
}

export interface CourseRecord {
  id: string;
  semester: string;
  courseCode: string;
  courseName: string;
  creditText: string;
  creditNumber?: number;
  section: string;
  day: string;
  time: string;
  studentCount: number;
  instructorCount: number;
  instructorText: string;
  instructors: string[];
  coInstructors?: string[];
  workload?: number; // Calculated in Milestone 3
  workloadError?: string; // Descriptive reason if calculation failed (e.g. invalid credit or 0 instructors)
  teachingType?: 'บรรยาย' | 'ปฏิบัติ' | 'บรรยาย/ปฏิบัติ' | string;
  rawRowIndex?: number;
}

export interface DashboardSummary {
  courseCount: number | null;
  sectionCount: number | null;
  coInstructorCount: number | null;
  totalWorkload: number | null; // Calculated sum in Milestone 3
  invalidWorkloadCount?: number;
}

export type UIState = 'initial' | 'loading' | 'empty' | 'error' | 'loaded';

export interface SheetMetadata {
  spreadsheetName: string;
  tabNames: string[];
  activeTab: string;
  totalRows: number;
  headers: string[];
  lastUpdated?: string;
}

export interface DataMappingField {
  appField: string;
  label: string;
  sheetColumn: string | null;
  status: 'matched' | 'missing' | 'custom';
}

export interface AppsScriptResponse {
  success: boolean;
  message?: string;
  metadata?: SheetMetadata;
  semesters?: SemesterOption[];
  instructors?: InstructorOption[];
  courses?: CourseRecord[];
  columnMapping?: Record<string, string>;
  error?: string;
}

import { CourseRecord, DataMappingField, InstructorOption, SemesterOption } from '../types';
import { calculateTeachingWorkload, parseMainCredit } from './workloadCalculator';

/**
 * Column alias patterns for auto-detecting headers in ENMSU_CoruseDatabase
 */
export const COLUMN_ALIAS_MAP: Record<string, string[]> = {
  semester: [
    'ภาคเรียน/ปีการศึกษา',
    'ภาคการศึกษา/ปีการศึกษา',
    'ภาคเรียน',
    'ภาคการศึกษา',
    'ปีการศึกษา',
    'semester',
    'term',
    'academic_year',
    'academicyear',
    'sem',
  ],
  courseCode: [
    'รหัสวิชา',
    'รหัสรายวิชา',
    'รหัส',
    'course_code',
    'coursecode',
    'code',
    'subject_code',
    'course_id',
    'courseid',
  ],
  courseName: [
    'ชื่อวิชา',
    'ชื่อรายวิชา',
    'รายวิชา',
    'course_name',
    'coursename',
    'name',
    'subject_name',
    'title',
  ],
  creditText: [
    'หน่วยกิต',
    'หน่วยกิต(บรรยาย-ปฏิบัติ-ศึกษาด้วยตนเอง)',
    'หน่วยกิตรวม',
    'credit',
    'credits',
    'cr',
  ],
  section: [
    'กลุ่ม',
    'กลุ่มเรียน',
    'ตอน',
    'หมู่เรียน',
    'section',
    'sec',
    'sec.',
    'group',
  ],
  day: [
    'วัน',
    'วันที่สอน',
    'วันสอน',
    'day',
    'day_of_week',
    'dayofweek',
  ],
  time: [
    'เวลา',
    'เวลาเรียน',
    'เวลาสอน',
    'ช่วงเวลา',
    'time',
    'schedule',
    'class_time',
  ],
  studentCount: [
    'จำนวนนิสิต',
    'จำนวนนักศึกษา',
    'ยอดนิสิต',
    'ยอดลงทะเบียน',
    'นิสิต',
    'student_count',
    'students',
    'enrolled',
  ],
  instructors: [
    'อาจารย์ผู้สอน',
    'ผู้สอน',
    'รายชื่ออาจารย์',
    'อาจารย์',
    'instructor',
    'instructors',
    'lecturer',
    'lecturers',
    'teacher',
  ],
  numberOfInstructors: [
    'จำนวนผู้สอน',
    'จำนวนอาจารย์',
    'instructor_count',
    'num_instructors',
    'instructorcount',
  ],
  teachingType: [
    'ประเภทวิชา',
    'ประเภทการสอน',
    'ประเภท',
    'ท/ป',
    'ท-ป',
    'lecture_lab',
    'type',
    'course_type',
  ],
};

/**
 * Standard readable labels in Thai for mapping tables
 */
export const APP_FIELD_LABELS: Record<string, string> = {
  semester: 'ภาคเรียน / ปีการศึกษา',
  courseCode: 'รหัสวิชา',
  courseName: 'รายวิชา',
  creditText: 'หน่วยกิต',
  section: 'กลุ่ม',
  day: 'วัน',
  time: 'เวลา',
  studentCount: 'จำนวนนิสิต',
  instructors: 'อาจารย์ผู้สอน',
  numberOfInstructors: 'จำนวนผู้สอน',
  teachingType: 'ประเภทการสอน',
};

/**
 * Clean & normalize string tokens for comparison
 */
function cleanString(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str).trim();
}

function normalizeHeaderName(header: string): string {
  return header
    .toLowerCase()
    .replace(/[\s\-_()\[\]\/\\]/g, '')
    .trim();
}

/**
 * Automatically map raw spreadsheet header row to application fields
 */
export function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const [appField, aliases] of Object.entries(COLUMN_ALIAS_MAP)) {
    // 1. Exact match
    const exactMatch = headers.find((h) => aliases.includes(h.trim()));
    if (exactMatch) {
      mapping[appField] = exactMatch;
      continue;
    }

    // 2. Normalized match (without spaces, symbols, lowercase)
    const normalizedMatch = headers.find((h) => {
      const normH = normalizeHeaderName(h);
      return aliases.some((alias) => normalizeHeaderName(alias) === normH);
    });
    if (normalizedMatch) {
      mapping[appField] = normalizedMatch;
      continue;
    }

    // 3. Substring match
    const substringMatch = headers.find((h) => {
      const normH = normalizeHeaderName(h);
      return aliases.some((alias) => {
        const normAlias = normalizeHeaderName(alias);
        return normH.includes(normAlias) || normAlias.includes(normH);
      });
    });
    if (substringMatch) {
      mapping[appField] = substringMatch;
    }
  }

  return mapping;
}

/**
 * Generate mapping report structure for verification and UI
 */
export function generateMappingFields(
  headers: string[],
  activeMapping: Record<string, string>
): DataMappingField[] {
  return Object.keys(COLUMN_ALIAS_MAP).map((fieldKey) => {
    const matchedCol = activeMapping[fieldKey] || null;
    return {
      appField: fieldKey,
      label: APP_FIELD_LABELS[fieldKey] || fieldKey,
      sheetColumn: matchedCol,
      status: matchedCol && headers.includes(matchedCol) ? 'matched' : 'missing',
    };
  });
}

/**
 * Split instructors string or array into distinct individual names,
 * splitting on pipe (|), commas, slashes, semicolons, and stripping notes like (สอนออนไลน์)
 */
export function parseInstructorNames(rawInstructorInput: string | string[] | any): string[] {
  if (!rawInstructorInput) return [];

  const rawArray = Array.isArray(rawInstructorInput) ? rawInstructorInput : [rawInstructorInput];
  const names: string[] = [];

  for (const item of rawArray) {
    if (!item) continue;
    const str = typeof item === 'string' ? item : String(item);

    // Split on comma, slash, pipe, semicolon, newline, " และ ", or enumerated patterns like "1.", "2."
    const splitPattern = /[,;\/\|\n\r]+|\s+และ\s+|\d+\.\s*/g;
    const parts = str.split(splitPattern);

    for (let part of parts) {
      // Remove parenthesized annotations like (สอนออนไลน์), (สถานประกอบการ), (สำหรับนิสิต...), (ให้ลงทะเบียน...)
      part = part.replace(/\([^)]*\)|（[^）]*）/g, ' ');
      // Clean up leading/trailing punctuation, dashes, spaces, bullets, numbers
      part = part.replace(/^[\s\-–—\d\.]+|[\s\-–—]+$/g, '').trim();

      // Check if it looks like a valid instructor name (not empty, not pure punctuation/numbers, not short note)
      if (
        part.length > 0 &&
        !/^[\d\.\s\-–—]+$/.test(part) &&
        !/^(สอนออนไลน์|สถานประกอบการ|บรรยาย|ปฏิบัติ|หมายเหตุ|สำหรับนิสิต.*)$/i.test(part)
      ) {
        if (!names.includes(part)) {
          names.push(part);
        }
      }
    }
  }

  return names;
}

/**
 * Merge duplicate course records by composite key: semester + courseCode + section
 * 
 * Rules:
 * 1. Key = `${semester.trim()}::${courseCode.trim()}::${section.trim()}`
 * 2. Sum studentCount across all source rows in the group
 * 3. Combine & deduplicate instructor list across all source rows (e.g. A | B + A | C -> [A, B, C])
 * 4. Recalculate numberOfInstructors = Math.max(1, mergedInstructors.length)
 * 5. Calculate workload ONCE for the merged record: (4 × credit × 7.5) ÷ numberOfInstructors
 * 6. Populate coInstructors relative to targetInstructor (if provided)
 */
export function mergeDuplicateCourseRecords(
  records: CourseRecord[],
  targetInstructor?: string
): CourseRecord[] {
  if (!records || records.length === 0) return [];

  const groupMap = new Map<string, CourseRecord[]>();

  for (const record of records) {
    const sem = (record.semester || '').trim();
    const code = (record.courseCode || '').trim();
    const sec = (record.section || '').trim();
    const key = `${sem}::${code}::${sec}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(record);
  }

  const mergedList: CourseRecord[] = [];

  groupMap.forEach((group, key) => {
    const first = group[0];

    // Merge & deduplicate all instructor names across all rows in the group
    const mergedInstructors: string[] = [];
    group.forEach((row) => {
      const sourceNames = [
        ...(Array.isArray(row.instructors) ? row.instructors : []),
        row.instructorText,
      ];
      const parsed = parseInstructorNames(sourceNames);
      parsed.forEach((name) => {
        if (!mergedInstructors.includes(name)) {
          mergedInstructors.push(name);
        }
      });
    });

    // Determine actual number of instructors for the merged record
    const instructorCount = mergedInstructors.length > 0 ? mergedInstructors.length : Math.max(1, first.instructorCount || 1);
    const instructorText = mergedInstructors.length > 0 ? mergedInstructors.join(' | ') : first.instructorText;

    // Sum student count safely across all rows in group
    let totalStudents = 0;
    group.forEach((row) => {
      let count = 0;
      if (typeof row.studentCount === 'number' && !isNaN(row.studentCount)) {
        count = row.studentCount;
      } else if (row.studentCount) {
        const parsed = parseInt(String(row.studentCount).replace(/,/g, ''), 10);
        if (!isNaN(parsed)) count = parsed;
      }
      totalStudents += count;
    });

    // Credit extraction
    const creditText = first.creditText || (first.creditNumber ? String(first.creditNumber) : '—');
    const creditNumber = first.creditNumber ?? (parseMainCredit(creditText) ?? undefined);

    // Calculate workload ONCE for the merged record
    const workloadResult = calculateTeachingWorkload(creditNumber ?? creditText, instructorCount);

    // Filter co-instructors
    const coInstructors = targetInstructor
      ? mergedInstructors.filter(
          (name) =>
            name.toLowerCase() !== targetInstructor.toLowerCase() &&
            !targetInstructor.includes(name) &&
            !name.includes(targetInstructor)
        )
      : first.coInstructors || [];

    // Distinct teaching types merged if multiple exist
    const types = Array.from(
      new Set(group.map((r) => r.teachingType).filter((t): t is string => Boolean(t && t !== '—')))
    );
    const teachingType = types.length > 0 ? types.join(', ') : first.teachingType;

    const mergedRecord: CourseRecord = {
      id: `merged-${first.semester}-${first.courseCode}-${first.section}`,
      semester: first.semester,
      courseCode: first.courseCode,
      courseName: first.courseName,
      creditText: creditText,
      creditNumber: creditNumber,
      section: first.section,
      day: first.day,
      time: first.time,
      studentCount: totalStudents,
      instructorCount: instructorCount,
      instructorText: instructorText,
      instructors: mergedInstructors.length > 0 ? mergedInstructors : first.instructors,
      coInstructors: coInstructors,
      workload: workloadResult.isValid && workloadResult.workload !== null ? workloadResult.workload : undefined,
      workloadError: !workloadResult.isValid ? workloadResult.errorMessage : undefined,
      teachingType: teachingType,
      rawRowIndex: first.rawRowIndex,
    };

    mergedList.push(mergedRecord);
  });

  return mergedList;
}

/**
 * Normalize raw row records into structured CourseRecord array
 */
export function normalizeSheetRows(
  rows: Record<string, any>[],
  columnMapping: Record<string, string>
): CourseRecord[] {
  const unmergedRecords = rows
    .map((row, index) => {
      const getValue = (appField: string): string => {
        const colName = columnMapping[appField];
        if (!colName || row[colName] === undefined || row[colName] === null) {
          return '';
        }
        return cleanString(row[colName]);
      };

      const semester = getValue('semester');
      const courseCode = getValue('courseCode');
      const courseName = getValue('courseName');
      const creditText = getValue('creditText');
      const section = getValue('section');
      const day = getValue('day');
      const time = getValue('time');
      const rawStudents = getValue('studentCount');
      const rawInstructorText = getValue('instructors');
      const rawNumInstructors = getValue('numberOfInstructors');
      const teachingType = getValue('teachingType') || undefined;

      // Skip completely blank rows (e.g. trailing empty rows in spreadsheet)
      if (!courseCode && !courseName && !semester && !rawInstructorText) {
        return null;
      }

      // Parse students count safely without converting missing into 0 unless explicit
      let studentCount = 0;
      if (rawStudents !== '') {
        const parsed = parseInt(rawStudents.replace(/,/g, ''), 10);
        if (!isNaN(parsed)) studentCount = parsed;
      }

      // Parse instructors from column C
      const parsedInstructors = parseInstructorNames(rawInstructorText);
      
      // Determine instructor count: If column C contains multiple instructors separated by | or comma, use parsed count.
      let instructorCount = parsedInstructors.length > 0 ? parsedInstructors.length : 1;
      if (rawNumInstructors !== '') {
        const parsedNum = parseInt(rawNumInstructors, 10);
        if (!isNaN(parsedNum) && parsedNum > 0) {
          if (parsedInstructors.length <= 1 || parsedNum > parsedInstructors.length) {
            instructorCount = parsedNum;
          }
        }
      }

      // Extract credit number
      const creditNumber = parseMainCredit(creditText) ?? undefined;

      // Calculate workload for this record
      const workloadResult = calculateTeachingWorkload(creditNumber ?? creditText, instructorCount);

      const record: CourseRecord = {
        id: `course-${index + 1}-${courseCode || 'no-code'}-${section || '01'}`,
        semester: semester || 'ไม่ระบุภาคเรียน',
        courseCode: courseCode || '—',
        courseName: courseName || '—',
        creditText: creditText || '—',
        creditNumber: creditNumber,
        section: section || '—',
        day: day || '—',
        time: time || '—',
        studentCount: studentCount,
        instructorCount: instructorCount,
        instructorText: parsedInstructors.length > 0 ? parsedInstructors.join(' | ') : (rawInstructorText || '—'),
        instructors: parsedInstructors.length > 0 ? parsedInstructors : (rawInstructorText ? [rawInstructorText] : []),
        coInstructors: [],
        workload: workloadResult.isValid && workloadResult.workload !== null ? workloadResult.workload : undefined,
        workloadError: !workloadResult.isValid ? workloadResult.errorMessage : undefined,
        teachingType: teachingType || '—',
        rawRowIndex: index + 2,
      };

      return record;
    })
    .filter((r): r is CourseRecord => r !== null);

  return mergeDuplicateCourseRecords(unmergedRecords);
}

/**
 * Extract unique, cleanly sorted semesters from course records
 */
export function extractUniqueSemesters(courses: CourseRecord[]): SemesterOption[] {
  const map = new Map<string, SemesterOption>();

  courses.forEach((c) => {
    const sem = c.semester.trim();
    if (!sem || sem === '—' || sem === 'ไม่ระบุภาคเรียน') return;

    if (!map.has(sem)) {
      // Parse academic year and term if available (e.g. 2/2568 -> term 2, year 2568)
      const parts = sem.split('/');
      let term = '';
      let year = '';
      if (parts.length === 2) {
        term = parts[0].trim();
        year = parts[1].trim();
      }

      map.set(sem, {
        id: sem,
        label: sem,
        academicYear: year,
        term: term,
      });
    }
  });

  const list = Array.from(map.values());

  // Sort descending by academic year and term
  list.sort((a, b) => {
    if (a.academicYear && b.academicYear && a.academicYear !== b.academicYear) {
      return b.academicYear.localeCompare(a.academicYear, 'th', { numeric: true });
    }
    if (a.term && b.term) {
      return b.term.localeCompare(a.term, 'th', { numeric: true });
    }
    return b.label.localeCompare(a.label, 'th', { numeric: true });
  });

  return list;
}

/**
 * Extract unique, cleanly sorted instructors, optionally filtered by semester
 */
export function extractUniqueInstructors(
  courses: CourseRecord[],
  selectedSemester?: string
): InstructorOption[] {
  const filtered = selectedSemester
    ? courses.filter((c) => c.semester === selectedSemester)
    : courses;

  const countMap = new Map<string, number>();

  filtered.forEach((c) => {
    c.instructors.forEach((name) => {
      const trimmed = name.trim();
      if (!trimmed || trimmed === '—') return;
      countMap.set(trimmed, (countMap.get(trimmed) || 0) + 1);
    });
  });

  const list: InstructorOption[] = Array.from(countMap.entries()).map(([name, count]) => ({
    id: name,
    name: name,
    courseCount: count,
  }));

  // Sort Thai alphabetically
  list.sort((a, b) => a.name.localeCompare(b.name, 'th'));

  return list;
}

/**
 * Filter courses for selected semester and instructor, populating co-instructors
 */
export function filterCoursesForInstructor(
  courses: CourseRecord[],
  semester: string,
  instructorName: string
): CourseRecord[] {
  if (!semester || !instructorName) return [];

  return courses
    .filter((c) => {
      const matchSemester = c.semester === semester;
      const matchInstructor =
        c.instructors.includes(instructorName) ||
        c.instructorText.includes(instructorName);
      return matchSemester && matchInstructor;
    })
    .map((c) => {
      // Co-instructors are all other instructors except the selected one
      const coInst = c.instructors.filter(
        (name) => name.toLowerCase() !== instructorName.toLowerCase()
      );

      return {
        ...c,
        coInstructors: coInst,
      };
    });
}

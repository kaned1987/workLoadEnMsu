/**
 * Project/Thesis Course Detector for EN MSU
 * Faculty of Engineering, Mahasarakham University
 *
 * Courses identified as Project or Thesis are excluded from workload calculation.
 * They still display in the table but show workload = 0 and are excluded from totals.
 */

/**
 * Thai and English keywords that identify Project or Thesis courses.
 * Used for case-insensitive matching against courseName.
 *
 * Matching rules:
 * - Case-insensitive substring match
 * - A course matches if its name contains ANY of these keywords
 */
export const EXCLUDED_COURSE_KEYWORDS: string[] = [
  'โครงงาน',
  'วิทยานิพนธ์',
  'สารนิพนธ์',
  'project',
  'thesis',
  'capstone',
  'การค้นคว้าอิสระ',
];

/**
 * Returns true if the course name indicates a Project or Thesis course
 * that should be excluded from workload calculation.
 *
 * @param courseName - The course name to check (e.g., "โครงงานวิศวกรรม", "วิทยานิพนธ์")
 * @returns true if the course matches any excluded keyword
 *
 * @example
 * isProjectOrThesisCourse('โครงงานวิศวกรรมซอฟต์แวร์') // true
 * isProjectOrThesisCourse('การออกแบบระบบ')             // false
 * isProjectOrThesisCourse('วิทยานิพนธ์')               // true
 * isProjectOrThesisCourse('Capstone Project')          // true
 */
export function isProjectOrThesisCourse(courseName: string): boolean {
  if (!courseName || courseName.trim() === '' || courseName === '—') {
    return false;
  }

  const lowerName = courseName.toLowerCase();
  return EXCLUDED_COURSE_KEYWORDS.some((keyword) =>
    lowerName.includes(keyword.toLowerCase())
  );
}
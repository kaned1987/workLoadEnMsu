/**
 * Teaching Workload Calculation Engine for EN MSU
 * Faculty of Engineering, Mahasarakham University
 * 
 * Business Formula:
 * ภาระงาน = (4 × หน่วยกิต × 7.5) ÷ จำนวนผู้สอน
 * 
 * Where:
 * - หน่วยกิต = Main credit extracted from creditText (e.g. "3 (3-0-6)" -> 3)
 * - จำนวนผู้สอน = Actual number of instructors for the teaching record (> 0)
 * - 4 and 7.5 are fixed regulatory factors
 */

export interface WorkloadCalculationResult {
  workload: number | null;
  isValid: boolean;
  errorMessage?: string;
  creditUsed?: number;
  instructorCountUsed?: number;
}

export interface TotalWorkloadResult {
  totalWorkload: number | null;
  validCount: number;
  invalidCount: number;
  totalRecords: number;
}

/**
 * 1. Pure Credit Parser
 * Extracts the main numeric credit from creditText (e.g., "3 (3-0-6)" -> 3, "4 (3-2-7)" -> 4, "3" -> 3)
 * 
 * Rules:
 * - Trim whitespace
 * - Extract first valid integer or decimal number before parenthesis or standalone
 * - Reject empty, null, undefined, non-numeric strings
 * - Never guess a credit value
 */
export function parseMainCredit(creditInput: string | number | null | undefined): number | null {
  if (creditInput === null || creditInput === undefined) {
    return null;
  }

  if (typeof creditInput === 'number') {
    if (isNaN(creditInput) || !isFinite(creditInput) || creditInput <= 0) {
      return null;
    }
    return creditInput;
  }

  const trimmed = creditInput.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-' || trimmed.toLowerCase() === 'none' || trimmed.toLowerCase() === 'null') {
    return null;
  }

  // Match leading numeric value e.g., "3 (3-0-6)", "3(3-0-6)", "4.5 (3-3-9)", "3", " 2 (2-0-4) "
  const match = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)/);
  if (!match) {
    return null;
  }

  const parsed = parseFloat(match[1]);
  if (isNaN(parsed) || !isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

/**
 * 2. Dedicated Pure Workload Calculation Function
 * 
 * Formula: ภาระงาน = (4 × หน่วยกิต × 7.5) ÷ จำนวนผู้สอน
 * 
 * Validation:
 * - Validate credit: must be a positive number
 * - Validate numberOfInstructors: must be a positive number (> 0)
 * - Reject zero or negative instructors (no division by zero)
 * - Prevent NaN / Infinity
 * - Return structured result with clear error reasons
 */
export function calculateTeachingWorkload(
  creditInput: number | string | null | undefined,
  numberOfInstructors: number | null | undefined
): WorkloadCalculationResult {
  // Validate credit
  const credit = typeof creditInput === 'number' ? creditInput : parseMainCredit(creditInput);

  if (credit === null || credit === undefined || isNaN(credit) || !isFinite(credit) || credit <= 0) {
    return {
      workload: null,
      isValid: false,
      errorMessage: 'ไม่สามารถคำนวณได้: ไม่พบหน่วยกิตที่ถูกต้อง',
    };
  }

  // Validate number of instructors
  if (
    numberOfInstructors === null ||
    numberOfInstructors === undefined ||
    isNaN(numberOfInstructors) ||
    !isFinite(numberOfInstructors) ||
    numberOfInstructors <= 0
  ) {
    return {
      workload: null,
      isValid: false,
      errorMessage: 'ไม่สามารถคำนวณได้: ไม่พบจำนวนผู้สอน',
      creditUsed: credit,
    };
  }

  // Exact approved formula: (4 × หน่วยกิต × 7.5) ÷ จำนวนผู้สอน
  const calculatedWorkload = (4 * credit * 7.5) / numberOfInstructors;

  if (isNaN(calculatedWorkload) || !isFinite(calculatedWorkload)) {
    return {
      workload: null,
      isValid: false,
      errorMessage: 'ไม่สามารถคำนวณได้: ผลการคำนวณไม่ถูกต้อง',
      creditUsed: credit,
      instructorCountUsed: numberOfInstructors,
    };
  }

  return {
    workload: calculatedWorkload,
    isValid: true,
    creditUsed: credit,
    instructorCountUsed: numberOfInstructors,
  };
}

/**
 * 3. Total Workload Aggregator
 * Sum of all valid workload values currently displayed for the selected instructor and semester.
 * 
 * Calculates using full numeric precision and excludes invalid records safely.
 * If all records are invalid or empty, returns null.
 */
export function calculateTotalWorkload(
  records: Array<{ workload?: number | null }>
): TotalWorkloadResult {
  if (!records || records.length === 0) {
    return {
      totalWorkload: null,
      validCount: 0,
      invalidCount: 0,
      totalRecords: 0,
    };
  }

  let sum = 0;
  let validCount = 0;
  let invalidCount = 0;

  for (const record of records) {
    if (
      record.workload !== null &&
      record.workload !== undefined &&
      !isNaN(record.workload) &&
      isFinite(record.workload) &&
      record.workload >= 0
    ) {
      sum += record.workload;
      validCount++;
    } else {
      invalidCount++;
    }
  }

  return {
    totalWorkload: validCount > 0 ? sum : null,
    validCount,
    invalidCount,
    totalRecords: records.length,
  };
}

/**
 * 4. Helper for formatting workload display numbers
 * Formats with up to 2 decimal places, removing trailing zeros (e.g. 45, 22.5, 15.75)
 */
export function formatWorkload(workload: number | null | undefined): string {
  if (workload === null || workload === undefined || isNaN(workload) || !isFinite(workload)) {
    return '—';
  }

  // Format with up to 2 decimal places and strip unnecessary trailing zeros
  const formatted = workload.toFixed(2);
  const clean = parseFloat(formatted);
  return clean.toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

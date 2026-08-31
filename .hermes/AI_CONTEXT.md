# ระบบคำนวณภาระงานสอน (Teaching Workload Calculator)

> Faculty of Engineering, Mahasarakham University (EN MSU)

## ภาพรวม (Overview)

แอปพลิเคชันเว็บสำหรับคำนวณภาระงานสอนของอาจารย์คณะวิศวกรรมศาสตร์ มหาวิทยาลัยมหาสารคาม  
เชื่อมต่อกับ Google Sheets (`ENMSU_CoruseDatabase`) ผ่าน Google Apps Script Web App

- **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Runtime:** Bun (ใช้ `bun.lock` สำหรับ dependency)
- **Deploy:** Netlify (`netlify.toml`)
- **Spreadsheet:** Google Sheets เชื่อมต่อผ่าน Google Apps Script
- **Excel Export:** `xlsx` library (SheetJS) ส่งออกไฟล์ .xlsx

## โครงสร้างโปรเจค

```
workLoadEnMsu/
├── index.html                    # Entry point HTML
├── metadata.json                 # Project metadata (Gemini API manifest)
├── netlify.toml                  # Netlify deploy config
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite build config
├── bun.lock                      # Bun lockfile (ใช้ Bun จริง, npm fallback ได้)
├── public/                       # Static assets
├── google-apps-script/
│   └── Code.gs                   # Google Apps Script backend (doGet handler)
├── src/
│   ├── main.tsx                  # React entry
│   ├── App.tsx                   # Main app component (state management)
│   ├── types.ts                  # All TypeScript interfaces
│   ├── vite-env.d.ts             # Vite type declarations
│   ├── components/
│   │   ├── Header.tsx            # App header
│   │   ├── FilterSection.tsx     # Semester + Instructor dropdowns + Export button
│   │   ├── SummaryCards.tsx      # Dashboard summary cards (4 cards)
│   │   ├── CourseTable.tsx       # Course data table with workload column
│   │   ├── ConnectionModal.tsx   # Modal showing sheet metadata & mapping
│   │   ├── EmptyState.tsx        # Empty state placeholder
│   │   ├── ErrorState.tsx        # Error state placeholder
│   │   ├── LoadingSkeleton.tsx   # Loading skeleton components
│   │   └── Footer.tsx            # App footer
│   └── services/
│       ├── appsScriptService.ts      # API layer → Google Apps Script Web App
│       ├── sheetDataMapper.ts        # Raw row → CourseRecord mapping + column detection
│       ├── workloadCalculator.ts     # Workload formula engine
│       ├── excelExportService.ts     # Excel .xlsx generation & download
│       └── projectThesisDetector.ts  # ✅ Project/Thesis course detection
├── .hermes/
│   └── plans/
│       └── 2026-08-31_235000-exclude-project-thesis-from-workload.md
└── .gitignore
```

## Flow ข้อมูล

```
Google Sheets (ENMSU_CoruseDatabase)
        ↓  (Google Apps Script Web App — Code.gs)
appsScriptService.ts  (fetchFromAppsScript)
        ↓
sheetDataMapper.ts    (normalizeSheetRows → mergeDuplicateCourseRecords)
        ↓
App.tsx               (state management, filter, summary computation)
        ↓
components/           (CourseTable, SummaryCards, FilterSection)

Optional:
App.tsx → excelExportService.ts → Browser download (.xlsx)
```

## สูตรคำนวณภาระงาน

```
ภาระงาน = (4 × หน่วยกิต × 7.5) ÷ จำนวนผู้สอน
```

- หน่วยกิต: ดึงจากคอลัมน์หน่วยกิต เช่น "3 (3-0-6)" → 3
- จำนวนผู้สอน: จำนวนอาจารย์ที่สอนร่วมในวิชานั้น

## ฟีเจอร์ Project/Thesis Exclusion (เพิ่มล่าสุด)

รายวิชาที่เป็น "โครงงาน" หรือ "วิทยานิพนธ์" จะถูกกันออกจากการคำนวณภาระงาน  
โดย **ยังแสดงในตาราง** แต่มีค่า workload = 0

### หลักการทำงาน

1. **Detector:** `projectThesisDetector.ts` — เช็ค `courseName` ว่ามีคีย์เวิร์ดเหล่านี้หรือไม่:
   - `โครงงาน`, `วิทยานิพนธ์`, `สารนิพนธ์`, `การค้นคว้าอิสระ`
   - `project`, `thesis`, `capstone`
2. **ทุก Layer ที่สร้าง CourseRecord** จะตรวจสอบและเซ็ต `isExcluded=true`, `workload=0`
   - `sheetDataMapper.ts` → normalizeSheetRows + mergeDuplicateCourseRecords
   - `appsScriptService.ts` → getCourses
3. **Total Workload** (`workloadCalculator.calculateTotalWorkload`) ข้าม records ที่ `isExcluded=true`
4. **UI** (`CourseTable.tsx`) แสดง excluded count ใน warning banner
5. **Summary** (`SummaryCards.tsx`) แสดง footnote เกี่ยวกับ excluded count
6. **Excel** (`excelExportService.ts`) แสดง 0 ในคอลัมน์ภาระงาน

## TypeScript Interfaces (สำคัญ)

```typescript
interface CourseRecord {
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
  workload?: number;
  workloadError?: string;
  isExcluded?: boolean;                // ✅ Project/Thesis flag
  teachingType?: string;
  rawRowIndex?: number;
}

interface DashboardSummary {
  courseCount: number | null;
  sectionCount: number | null;
  coInstructorCount: number | null;
  totalWorkload: number | null;
  invalidWorkloadCount?: number;
  excludedCount?: number;              // ✅ Added
}
```

## การรันใน Local

```bash
# Install dependencies
npm install

# Dev server
npm run dev        # → http://localhost:3000

# Build for production
npm run build      # → dist/

# Type check
npm run lint       # = tsc --noEmit
```

## Apps Script URL

Default Web App URL อยู่ใน `src/services/appsScriptService.ts`:
```
DEFAULT_APPS_SCRIPT_URL
```

ผู้ใช้สามารถเปลี่ยน URL ผ่าน `ConnectionModal` (บันทึกใน localStorage)  
หรือผ่าน environment variable `VITE_APPS_SCRIPT_URL`

## Deployment

Netlify auto-deploy จาก GitHub.  
`netlify.toml` กำหนด build command และ rewrite rules สำหรับ SPA routing.
# ระบบคำนวณภาระงานสอน
### Teaching Workload Calculator — Faculty of Engineering, Mahasarakham University (EN MSU)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-purple)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com/)

---

## 📋 เกี่ยวกับ

เว็บแอปพลิเคชันสำหรับคำนวณภาระงานสอนของอาจารย์คณะวิศวกรรมศาสตร์ มหาวิทยาลัยมหาสารคาม  
เชื่อมต่อข้อมูลจาก Google Sheets (`ENMSU_CoruseDatabase`) ผ่าน Google Apps Script Web App

**สูตรคำนวณ:** `ภาระงาน = (4 × หน่วยกิต × 7.5) ÷ จำนวนผู้สอน`

## 🚀 ฟีเจอร์

- ✅ ดึงข้อมูลรายวิชาจาก Google Sheets แบบ Real-time
- ✅ คำนวณภาระงานตามสูตรมาตรฐานของคณะฯ
- ✅ แสดง Dashboard Summary Cards
- ✅ รองรับการสอนร่วม (Co-Instructor) หลายคน
- ✅ Merge ข้อมูลซ้ำอัตโนมัติ (semester + courseCode + section)
- ✅ **กันรายวิชา Project/Thesis ออกจากการคำนวณ** (โครงงาน/วิทยานิพนธ์ แสดง workload = 0)
- ✅ ส่งออกไฟล์ Excel (.xlsx) พร้อมรายงานภาระงาน
- ✅ จับคู่คอลัมน์จาก Spreadsheet อัตโนมัติ
- ✅ UI ภาษาไทย รองรับทั้ง Desktop และ Mobile

## 🛠 Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Excel | SheetJS (xlsx) |
| Backend | Google Apps Script (Code.gs) |
| Database | Google Sheets |
| Deploy | Netlify |

## 📁 โครงสร้างโปรเจค

```
src/
├── App.tsx                         # หลัก — จัดการ state, เรียก API
├── types.ts                        # TypeScript interfaces
├── main.tsx                        # Entry point
├── components/
│   ├── FilterSection.tsx           # เลือกภาคเรียน/อาจารย์ + ปุ่มส่งออก
│   ├── SummaryCards.tsx            # การ์ดสรุปผล 4 ใบ
│   ├── CourseTable.tsx             # ตารางรายวิชาและภาระงาน
│   ├── ConnectionModal.tsx         # Modal แสดง metadata ชีต
│   ├── Header.tsx / Footer.tsx     # ส่วนหัว/ท้าย
│   ├── EmptyState.tsx / ErrorState.tsx / LoadingSkeleton.tsx
├── services/
│   ├── appsScriptService.ts        # เชื่อมต่อ Google Apps Script API
│   ├── sheetDataMapper.ts          # จับคู่คอลัมน์ + merge duplicates
│   ├── workloadCalculator.ts       # กลไกคำนวณภาระงาน
│   ├── excelExportService.ts       # สร้างไฟล์ Excel
│   └── projectThesisDetector.ts    # 🔥 ตรวจจับ Project/Thesis
google-apps-script/
└── Code.gs                         # Google Apps Script backend
```

## 🏃 การรัน

```bash
# ติดตั้ง dependencies
npm install

# รัน dev server
npm run dev            # → http://localhost:3000

# ตรวจสอบ TypeScript
npm run lint           # tsc --noEmit

# Build สำหรับ production
npm run build
```

## 🔗 การเชื่อมต่อ Google Sheets

1. Deploy Google Apps Script (`google-apps-script/Code.gs`) เป็น Web App
2. คัดลอก Web App URL
3. วางใน `ConnectionModal` ในแอป หรือตั้งค่า `VITE_APPS_SCRIPT_URL`
4. Spreadsheet ต้องมีคอลัมน์: รหัสวิชา, ชื่อวิชา, หน่วยกิต, ผู้สอน, กลุ่ม, เวลา ฯลฯ

## 📊 การกันรายวิชา Project/Thesis

รายวิชาที่มีชื่อขึ้นต้น/มีคำเหล่านี้จะถูกกันออกจากการคำนวณภาระงาน:

- **ไทย:** โครงงาน, วิทยานิพนธ์, สารนิพนธ์, การค้นคว้าอิสระ
- **อังกฤษ:** project, thesis, capstone

รายวิชาเหล่านี้ยังคงแสดงในตาราง แต่มีค่า **ภาระงาน = 0** และไม่ถูกนำไปรวมในยอดรวม

## 📄 License

Internal use — Faculty of Engineering, Mahasarakham University
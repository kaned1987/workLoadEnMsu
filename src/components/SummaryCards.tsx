import React from 'react';
import { BookOpen, Users, UserCheck, Calculator } from 'lucide-react';
import { SummaryCardSkeleton } from './LoadingSkeleton';
import { DashboardSummary } from '../types';
import { formatWorkload } from '../services/workloadCalculator';

interface SummaryCardsProps {
  summary: DashboardSummary;
  isLoading?: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, isLoading = false }) => {
  if (isLoading) {
    return (
      <div id="summary-cards-skeleton" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </div>
    );
  }

  const cards = [
    {
      id: 'summary-card-courses',
      title: 'รายวิชาที่สอน',
      value: summary.courseCount !== null ? summary.courseCount.toString() : '—',
      unit: summary.courseCount !== null ? 'วิชา' : '',
      icon: BookOpen,
      iconColor: 'text-[#800000]',
      iconBg: 'bg-[#fdf2f2]',
      borderColor: 'border-slate-200',
    },
    {
      id: 'summary-card-sections',
      title: 'กลุ่มเรียน',
      value: summary.sectionCount !== null ? summary.sectionCount.toString() : '—',
      unit: summary.sectionCount !== null ? 'กลุ่ม' : '',
      icon: Users,
      iconColor: 'text-blue-700',
      iconBg: 'bg-blue-50',
      borderColor: 'border-slate-200',
    },
    {
      id: 'summary-card-co-instructors',
      title: 'จำนวนผู้สอนร่วม',
      value: summary.coInstructorCount !== null ? summary.coInstructorCount.toString() : '—',
      unit: summary.coInstructorCount !== null ? 'คน' : '',
      icon: UserCheck,
      iconColor: 'text-amber-700',
      iconBg: 'bg-amber-50',
      borderColor: 'border-slate-200',
    },
    {
      id: 'summary-card-total-workload',
      title: 'ภาระงานรวม',
      value: formatWorkload(summary.totalWorkload),
      unit: summary.totalWorkload !== null ? 'ชม./สัปดาห์' : '',
      icon: Calculator,
      iconColor: 'text-[#800000]',
      iconBg: 'bg-[#fdf2f2]',
      borderColor: 'border-[#f3d1d1]',
      isHighlight: true,
      footnote: summary.invalidWorkloadCount && summary.invalidWorkloadCount > 0 ? `(ยกเว้น ${summary.invalidWorkloadCount} รายการที่ไม่สามารถคำนวณได้)` : undefined,
    },
  ];

  return (
    <div id="dashboard-summary-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            className={`bg-white rounded-xl border ${card.borderColor} p-5 shadow-2xs transition-all hover:border-slate-300 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-600">
                {card.title}
              </span>
              <div className={`w-9 h-9 rounded-lg ${card.iconBg} ${card.iconColor} flex items-center justify-center`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${card.isHighlight ? 'text-[#800000]' : 'text-slate-900'}`}>
                  {card.value}
                </span>
                {card.unit && (
                  <span className="text-xs text-slate-500 font-medium">
                    {card.unit}
                  </span>
                )}
              </div>
              {card.footnote && (
                <p className="text-[11px] text-amber-600 mt-1">{card.footnote}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

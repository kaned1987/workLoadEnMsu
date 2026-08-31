import React from 'react';

export const SummaryCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-slate-200 rounded w-24"></div>
        <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
      </div>
      <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
      <div className="h-3 bg-slate-100 rounded w-32"></div>
    </div>
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
      <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
      <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div></td>
      <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div></td>
      <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded w-14 mx-auto"></div></td>
      <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded w-20 mx-auto"></div></td>
      <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded w-10 mx-auto"></div></td>
      <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div></td>
      <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
    </tr>
  );
};

import React from 'react';

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  variant: 'blue' | 'green' | 'red';
};

const variantStyles = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
};

export function StatCard({ icon, label, value, subtext, variant }: StatCardProps) {
  return (
    <div className="bg-white shadow-sm ring-1 ring-slate-900/5 rounded-lg p-6 hover:shadow-md transition">
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${variantStyles[variant]}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-3xl font-semibold text-slate-900 tabular-nums">{value}</p>
          {subtext && <p className="text-sm text-slate-400">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

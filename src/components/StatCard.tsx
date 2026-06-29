import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit, subtitle }) => {
  return (
    <div className="bg-dark-secondary rounded-card p-4 border border-dark-divider text-center">
      <div className="text-3xl font-bold text-dark mb-1">
        {value}
        {unit && <span className="text-lg font-normal ml-1">{unit}</span>}
      </div>
      <div className="text-xs font-medium text-dark-text-secondary">{label}</div>
      {subtitle && <div className="text-xs text-dark-text-secondary/60 mt-1">{subtitle}</div>}
    </div>
  );
};

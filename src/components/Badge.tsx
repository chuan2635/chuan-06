import React from 'react';
import { ExecutionStatus } from '@/types';

interface BadgeProps {
  status: ExecutionStatus;
  label?: string;
}

const statusConfig = {
  success: { bg: '#30D158', text: 'white', icon: '✅' },
  failed: { bg: '#FF3B30', text: 'white', icon: '❌' },
  cancelled: { bg: '#636366', text: 'white', icon: '⬜' },
  running: { bg: '#0A84FF', text: 'white', icon: '⏳' },
};

export const Badge: React.FC<BadgeProps> = ({ status, label }) => {
  const config = statusConfig[status];

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-pill text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.icon}
      {label || status}
    </span>
  );
};

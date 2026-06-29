import React from 'react';

interface MentionPillProps {
  icon: string;
  label: string;
  onClick?: () => void;
}

export const MentionPill: React.FC<MentionPillProps> = ({ icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-pill bg-dark-secondary text-dark-text-secondary text-sm font-medium hover:text-dark transition-colors"
    >
      {icon}
      {label}
    </button>
  );
};

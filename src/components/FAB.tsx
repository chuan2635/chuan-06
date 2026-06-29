import React from 'react';

interface FABProps {
  icon?: string;
  label?: string;
  onClick: () => void;
  className?: string;
}

export const FAB: React.FC<FABProps> = ({ icon = '⊡', label, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-16 h-16 rounded-full bg-white text-dark shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl font-semibold ${className}`}
      title={label}
    >
      {icon}
    </button>
  );
};

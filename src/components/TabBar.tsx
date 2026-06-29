import React from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-dark-divider">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === tab.id
              ? 'text-brand-purple border-b-brand-purple'
              : 'text-dark-text-secondary border-b-transparent hover:text-dark'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

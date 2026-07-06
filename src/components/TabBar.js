import { jsx as _jsx } from "react/jsx-runtime";
export const TabBar = ({ tabs, activeTab, onTabChange }) => {
    return (_jsx("div", { className: "flex border-b border-dark-divider", children: tabs.map((tab) => (_jsx("button", { onClick: () => onTabChange(tab.id), className: `px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === tab.id
                ? 'text-brand-purple border-b-brand-purple'
                : 'text-dark-text-secondary border-b-transparent hover:text-dark'}`, children: tab.label }, tab.id))) }));
};

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const StatCard = ({ label, value, unit, subtitle }) => {
    return (_jsxs("div", { className: "bg-dark-secondary rounded-card p-4 border border-dark-divider text-center", children: [_jsxs("div", { className: "text-3xl font-bold text-dark mb-1", children: [value, unit && _jsx("span", { className: "text-lg font-normal ml-1", children: unit })] }), _jsx("div", { className: "text-xs font-medium text-dark-text-secondary", children: label }), subtitle && _jsx("div", { className: "text-xs text-dark-text-secondary/60 mt-1", children: subtitle })] }));
};

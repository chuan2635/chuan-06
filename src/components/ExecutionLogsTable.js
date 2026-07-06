import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from './Badge';
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
};
const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
};
const formatTokens = (tokens) => {
    return `${(tokens / 1000).toFixed(1)}k`;
};
export const ExecutionLogsTable = ({ logs }) => {
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-dark-divider", children: [_jsx("th", { className: "text-left px-4 py-2 text-dark-text-secondary font-medium", children: "\u65E5\u671F" }), _jsx("th", { className: "text-left px-4 py-2 text-dark-text-secondary font-medium", children: "\u89F8\u767C\u539F\u56E0" }), _jsx("th", { className: "text-left px-4 py-2 text-dark-text-secondary font-medium", children: "\u72C0\u614B" }), _jsx("th", { className: "text-left px-4 py-2 text-dark-text-secondary font-medium", children: "\u6642\u9577" }), _jsx("th", { className: "text-left px-4 py-2 text-dark-text-secondary font-medium", children: "Tokens" })] }) }), _jsx("tbody", { children: logs.map((log) => (_jsxs("tr", { className: "border-b border-dark-divider hover:bg-dark-secondary/50", children: [_jsx("td", { className: "px-4 py-3 text-dark-text-secondary", children: formatDate(log.started_at) }), _jsx("td", { className: "px-4 py-3 text-dark-text-secondary capitalize", children: log.triggered_by }), _jsx("td", { className: "px-4 py-3", children: _jsx(Badge, { status: log.status }) }), _jsx("td", { className: "px-4 py-3 text-dark-text-secondary", children: formatDuration(log.duration_seconds) }), _jsx("td", { className: "px-4 py-3 text-dark-text-secondary", children: formatTokens(log.tokens_used) })] }, log.id))) })] }) }));
};

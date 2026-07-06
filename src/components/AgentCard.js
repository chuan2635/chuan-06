import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const AgentCard = ({ agent, onClick }) => {
    return (_jsx("button", { onClick: onClick, className: "bg-dark-secondary hover:bg-dark-secondary/80 rounded-card p-4 border border-dark-divider transition-all text-left", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-dark mb-2", children: agent.name }), _jsx("div", { className: "inline-block px-2 py-1 rounded-pill text-xs font-medium text-dark-text-secondary bg-dark-divider", children: "\u958B\u7F6E" })] }), _jsx("div", { className: "text-2xl", children: agent.avatar_icon || '🤖' })] }) }));
};

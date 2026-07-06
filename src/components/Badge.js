import { jsxs as _jsxs } from "react/jsx-runtime";
const statusConfig = {
    success: { bg: '#30D158', text: 'white', icon: '✅' },
    failed: { bg: '#FF3B30', text: 'white', icon: '❌' },
    cancelled: { bg: '#636366', text: 'white', icon: '⬜' },
    running: { bg: '#0A84FF', text: 'white', icon: '⏳' },
};
export const Badge = ({ status, label }) => {
    const config = statusConfig[status];
    return (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-1 rounded-pill text-xs font-medium", style: { backgroundColor: config.bg, color: config.text }, children: [config.icon, label || status] }));
};

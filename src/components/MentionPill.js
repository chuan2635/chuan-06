import { jsxs as _jsxs } from "react/jsx-runtime";
export const MentionPill = ({ icon, label, onClick }) => {
    return (_jsxs("button", { onClick: onClick, className: "inline-flex items-center gap-1 px-2 py-1 rounded-pill bg-dark-secondary text-dark-text-secondary text-sm font-medium hover:text-dark transition-colors", children: [icon, label] }));
};

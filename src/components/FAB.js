import { jsx as _jsx } from "react/jsx-runtime";
export const FAB = ({ icon = '⊡', label, onClick, className = '' }) => {
    return (_jsx("button", { onClick: onClick, className: `fixed bottom-6 right-6 w-16 h-16 rounded-full bg-white text-dark shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl font-semibold ${className}`, title: label, children: icon }));
};

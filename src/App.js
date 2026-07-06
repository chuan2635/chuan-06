import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { FolderListPage, AgentDetailPage } from '@/pages';
export const App = () => {
    const [selectedAgentId, setSelectedAgentId] = useState(null);
    const [folderId] = useState('default-folder'); // 應該從路由或 context 獲取
    return (_jsxs("div", { className: "w-full h-full", children: [_jsx(FolderListPage, { folderId: folderId, onAgentSelect: setSelectedAgentId, onCreateAgent: () => {
                    // 開啟建立 Agent modal
                    console.log('Create agent');
                } }), selectedAgentId && (_jsx(AgentDetailPage, { agentId: selectedAgentId, onClose: () => setSelectedAgentId(null) }))] }));
};

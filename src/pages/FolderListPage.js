import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { agentApi } from '@/api/agentApi';
import { folderApi } from '@/api/folderApi';
import { AgentCard, FAB } from '@/components';
export const FolderListPage = ({ folderId, onAgentSelect, onCreateAgent, }) => {
    const [folder, setFolder] = useState(null);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [folderData, agentsData] = await Promise.all([
                    folderApi.getFolder(folderId),
                    agentApi.listAgents(folderId),
                ]);
                setFolder(folderData);
                setAgents(agentsData);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            }
            finally {
                setLoading(false);
            }
        };
        loadData();
    }, [folderId]);
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-dark", children: _jsx("div", { className: "text-dark-text-secondary", children: "Loading..." }) }));
    }
    if (error) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-dark", children: _jsxs("div", { className: "text-red-400", children: ["Error: ", error] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-dark p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { className: "p-2 hover:bg-dark-secondary rounded-lg transition-colors", children: "\u2261" }), _jsx("h1", { className: "text-2xl font-semibold text-dark", children: folder?.name || 'Agents' })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "px-3 py-2 text-sm text-dark-text-secondary hover:text-dark transition-colors", children: "\u65B0\u589E\u6A21\u677F" }), _jsx("button", { className: "p-2 hover:bg-dark-secondary rounded-lg transition-colors", children: "\u2191" }), _jsx("button", { className: "p-2 hover:bg-dark-secondary rounded-lg transition-colors", children: "..." })] })] }), _jsx("div", { className: "grid grid-cols-2 gap-4 mb-8", children: agents.length === 0 ? (_jsxs("div", { className: "col-span-2 text-center py-12", children: [_jsx("p", { className: "text-dark-text-secondary mb-4", children: "\u9084\u6C92\u6709 AI \u54E1\u5DE5" }), _jsx("button", { onClick: onCreateAgent, className: "px-4 py-2 bg-brand-purple text-white rounded-pill font-medium hover:bg-brand-purple-alt transition-colors", children: "\u5EFA\u7ACB\u7B2C\u4E00\u500B\u54E1\u5DE5" })] })) : (_jsxs(_Fragment, { children: [agents.map((agent) => (_jsx(AgentCard, { agent: agent, onClick: () => onAgentSelect(agent.id) }, agent.id))), _jsx("button", { onClick: onCreateAgent, className: "min-h-24 bg-dark-secondary rounded-card border-2 border-dashed border-dark-divider hover:border-brand-purple transition-colors flex items-center justify-center", children: _jsx("span", { className: "text-2xl text-dark-text-secondary", children: "\uFF0B \u65B0\u589E\u54E1\u5DE5" }) })] })) }), _jsx(FAB, { icon: "\u22A1", label: "\u65B0\u589E\u54E1\u5DE5", onClick: onCreateAgent })] }));
};

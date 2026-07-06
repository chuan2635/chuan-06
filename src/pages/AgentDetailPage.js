import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { agentApi } from '@/api/agentApi';
import { TabBar, StatCard, ExecutionLogsTable } from '@/components';
export const AgentDetailPage = ({ agentId, onClose }) => {
    const [agent, setAgent] = useState(null);
    const [memory, setMemory] = useState(null);
    const [executionLogs, setExecutionLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const tabs = [
        { id: 'overview', label: '總覽' },
        { id: 'settings', label: '設定' },
        { id: 'memory', label: '記憶' },
        { id: 'skills', label: '技能' },
        { id: 'budget', label: '預算' },
    ];
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [agentData, memoryData, logsData, statsData] = await Promise.all([
                    agentApi.getAgent(agentId),
                    agentApi.getMemory(agentId),
                    agentApi.listExecutionLogs(agentId),
                    agentApi.getExecutionStats(agentId),
                ]);
                setAgent(agentData);
                setMemory(memoryData);
                setExecutionLogs(logsData);
                setStats(statsData);
            }
            catch (error) {
                console.error('Failed to load agent data:', error);
            }
            finally {
                setLoading(false);
            }
        };
        loadData();
    }, [agentId]);
    if (loading || !agent) {
        return _jsx("div", { className: "min-h-screen bg-dark flex items-center justify-center", children: "Loading..." });
    }
    return (_jsx("div", { className: "fixed inset-0 bg-dark bg-opacity-50 flex items-end z-50", children: _jsxs("div", { className: "w-full bg-dark rounded-t-2xl border-t border-dark-divider max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "sticky top-0 bg-dark border-b border-dark-divider p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: agent.avatar_icon || '🤖' }), _jsx("h2", { className: "text-xl font-semibold text-dark", children: agent.name })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "p-2 hover:bg-dark-secondary rounded-lg", children: "..." }), _jsx("button", { onClick: onClose, className: "p-2 hover:bg-dark-secondary rounded-lg", children: "\u00D7" })] })] }), _jsx(TabBar, { tabs: tabs, activeTab: activeTab, onTabChange: setActiveTab })] }), _jsxs("div", { className: "p-4", children: [activeTab === 'overview' && (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "grid grid-cols-3 gap-3", children: stats && (_jsxs(_Fragment, { children: [_jsx(StatCard, { label: "\u5E73\u5747 Credits Cost", value: stats.totalCredits > 0 ? (stats.totalCredits / stats.totalExecutions).toFixed(2) : 0, unit: "credits", subtitle: "\u6BCF\u6B21\u57F7\u884C" }), _jsx(StatCard, { label: "\u5E73\u5747 Tokens", value: stats.totalTokens > 0 ? (stats.totalTokens / stats.totalExecutions / 1000).toFixed(1) : 0, unit: "k", subtitle: "\u6BCF\u6B21\u57F7\u884C" }), _jsx(StatCard, { label: "\u5E73\u5747\u57F7\u884C\u6642\u9577", value: stats.avgDuration > 0
                                                    ? `${Math.floor(stats.avgDuration / 60)}m`
                                                    : '0m', subtitle: "\u6BCF\u6B21\u57F7\u884C" })] })) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-dark mb-3", children: "\u57F7\u884C\u7D00\u9304" }), executionLogs.length > 0 ? (_jsx(ExecutionLogsTable, { logs: executionLogs.slice(0, 10) })) : (_jsx("p", { className: "text-dark-text-secondary", children: "\u6C92\u6709\u57F7\u884C\u7D00\u9304" }))] })] })), activeTab === 'settings' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-dark-text-secondary mb-2 block", children: "\u54E1\u5DE5\u540D\u7A31" }), _jsx("input", { type: "text", value: agent.name, className: "w-full px-3 py-2 bg-dark-secondary rounded-pill border border-dark-divider text-dark placeholder-dark-text-secondary focus:outline-none focus:border-brand-purple", placeholder: "\u54E1\u5DE5\u540D\u7A31" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-dark-text-secondary mb-2 block", children: "\u54E1\u5DE5\u6307\u4EE4" }), _jsx("textarea", { value: agent.instructions, className: "w-full px-3 py-2 bg-dark-secondary rounded-lg border border-dark-divider text-dark placeholder-dark-text-secondary focus:outline-none focus:border-brand-purple min-h-32 resize-none", placeholder: "\u8F38\u5165\u54E1\u5DE5\u7684\u6307\u4EE4\u548C\u8077\u8CAC" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-dark-text-secondary mb-2 block", children: "AI \u6A21\u578B" }), _jsxs("select", { className: "w-full px-3 py-2 bg-dark-secondary rounded-pill border border-dark-divider text-dark focus:outline-none focus:border-brand-purple", children: [_jsx("option", { children: "Auto" }), _jsx("option", { children: "claude-opus-4-8" }), _jsx("option", { children: "claude-sonnet-4-6" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-dark-text-secondary mb-2 block", children: "\u6700\u5927\u57F7\u884C\u8F2A\u6578" }), _jsxs("select", { className: "w-full px-3 py-2 bg-dark-secondary rounded-pill border border-dark-divider text-dark focus:outline-none focus:border-brand-purple", children: [_jsx("option", { children: "10 \u8F2A" }), _jsx("option", { children: "20 \u8F2A" }), _jsx("option", { selected: true, children: "50 \u8F2A" }), _jsx("option", { children: "100 \u8F2A" })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm font-medium text-dark-text-secondary", children: "\u5B9A\u671F\u6392\u7A0B" }), _jsx("input", { type: "checkbox", className: "w-5 h-5" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm font-medium text-dark-text-secondary", children: "\u958B\u555F\u901A\u77E5" }), _jsx("input", { type: "checkbox", className: "w-5 h-5", checked: true })] })] })), activeTab === 'memory' && (_jsx("div", { children: _jsx("textarea", { value: memory?.content || '', className: "w-full px-3 py-2 bg-dark-secondary rounded-lg border border-dark-divider text-dark placeholder-dark-text-secondary focus:outline-none focus:border-brand-purple min-h-64 resize-none font-mono text-sm", placeholder: "# \u9577\u671F\u8A18\u61B6\n\n\u5728\u6B64\u8A18\u9304 Agent \u7684\u9577\u671F\u8A18\u61B6\u5167\u5BB9..." }) })), activeTab === 'skills' && (_jsx("div", { className: "space-y-2", children: [
                                { name: 'read_folder', label: '讀取資料夾' },
                                { name: 'create_note', label: '新增筆記' },
                                { name: 'update_note', label: '更新筆記' },
                                { name: 'create_chart', label: '新增圖表' },
                                { name: 'web_search', label: '網路搜尋' },
                                { name: 'fetch_stock_data', label: '抓取台股資料' },
                            ].map((skill) => (_jsxs("label", { className: "flex items-center gap-2 p-2 hover:bg-dark-secondary rounded-lg cursor-pointer", children: [_jsx("input", { type: "checkbox", defaultChecked: true, className: "w-4 h-4" }), _jsx("span", { className: "text-dark", children: skill.label })] }, skill.name))) })), activeTab === 'budget' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-dark-text-secondary", children: "\u5DF2\u4F7F\u7528" }), _jsx("span", { className: "text-sm font-medium text-dark-text-secondary", children: "\u9810\u7B97" })] }), _jsxs("div", { className: "text-2xl font-bold text-dark mb-1", children: ["61 credits ", _jsx("span", { className: "text-lg", children: "\u2014\uFF08\u672A\u8A2D\u5B9A\uFF09" })] }), _jsx("p", { className: "text-sm text-dark-text-secondary", children: "\u672A\u8A2D\u5B9A\u9810\u7B97" })] }), _jsx("div", { children: _jsx("p", { className: "text-sm text-dark-text-secondary mb-3", children: "\u904E\u53BB 7 \u5929\u5E73\u5747\u6D88\u8017 8.7 credits / \u5929" }) }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-dark-text-secondary mb-2 block", children: "\u6708\u9810\u7B97\uFF08CREDITS\uFF09" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "number", defaultValue: "0", className: "flex-1 px-3 py-2 bg-dark-secondary rounded-pill border border-dark-divider text-dark focus:outline-none focus:border-brand-purple" }), _jsx("button", { className: "px-4 py-2 bg-brand-purple text-white rounded-pill font-medium hover:bg-brand-purple-alt transition-colors", children: "\u66F4\u65B0\u9810\u7B97" })] })] })] }))] })] }) }));
};

import React, { useState, useEffect } from 'react';
import { Agent, AgentMemory, ExecutionLog, ExecutionStats } from '@/types';
import { agentApi } from '@/api/agentApi';
import { TabBar, StatCard, ExecutionLogsTable } from '@/components';

interface AgentDetailPageProps {
  agentId: string;
  onClose: () => void;
}

export const AgentDetailPage: React.FC<AgentDetailPageProps> = ({ agentId, onClose }) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [memory, setMemory] = useState<AgentMemory | null>(null);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
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
      } catch (error) {
        console.error('Failed to load agent data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [agentId]);

  if (loading || !agent) {
    return <div className="min-h-screen bg-dark flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-dark bg-opacity-50 flex items-end z-50">
      {/* Sheet */}
      <div className="w-full bg-dark rounded-t-2xl border-t border-dark-divider max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dark border-b border-dark-divider p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{agent.avatar_icon || '🤖'}</span>
              <h2 className="text-xl font-semibold text-dark">{agent.name}</h2>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-dark-secondary rounded-lg">...</button>
              <button onClick={onClose} className="p-2 hover:bg-dark-secondary rounded-lg">
                ×
              </button>
            </div>
          </div>

          {/* Tab Bar */}
          <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                {stats && (
                  <>
                    <StatCard
                      label="平均 Credits Cost"
                      value={stats.totalCredits > 0 ? (stats.totalCredits / stats.totalExecutions).toFixed(2) : 0}
                      unit="credits"
                      subtitle="每次執行"
                    />
                    <StatCard
                      label="平均 Tokens"
                      value={stats.totalTokens > 0 ? (stats.totalTokens / stats.totalExecutions / 1000).toFixed(1) : 0}
                      unit="k"
                      subtitle="每次執行"
                    />
                    <StatCard
                      label="平均執行時長"
                      value={
                        stats.avgDuration > 0
                          ? `${Math.floor(stats.avgDuration / 60)}m`
                          : '0m'
                      }
                      subtitle="每次執行"
                    />
                  </>
                )}
              </div>

              {/* Execution Logs Table */}
              <div>
                <h3 className="text-sm font-semibold text-dark mb-3">執行紀錄</h3>
                {executionLogs.length > 0 ? (
                  <ExecutionLogsTable logs={executionLogs.slice(0, 10)} />
                ) : (
                  <p className="text-dark-text-secondary">沒有執行紀錄</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-dark-text-secondary mb-2 block">
                  員工名稱
                </label>
                <input
                  type="text"
                  value={agent.name}
                  className="w-full px-3 py-2 bg-dark-secondary rounded-pill border border-dark-divider text-dark placeholder-dark-text-secondary focus:outline-none focus:border-brand-purple"
                  placeholder="員工名稱"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-dark-text-secondary mb-2 block">
                  員工指令
                </label>
                <textarea
                  value={agent.instructions}
                  className="w-full px-3 py-2 bg-dark-secondary rounded-lg border border-dark-divider text-dark placeholder-dark-text-secondary focus:outline-none focus:border-brand-purple min-h-32 resize-none"
                  placeholder="輸入員工的指令和職責"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-dark-text-secondary mb-2 block">
                  AI 模型
                </label>
                <select className="w-full px-3 py-2 bg-dark-secondary rounded-pill border border-dark-divider text-dark focus:outline-none focus:border-brand-purple">
                  <option>Auto</option>
                  <option>claude-opus-4-8</option>
                  <option>claude-sonnet-4-6</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-text-secondary mb-2 block">
                  最大執行輪數
                </label>
                <select className="w-full px-3 py-2 bg-dark-secondary rounded-pill border border-dark-divider text-dark focus:outline-none focus:border-brand-purple">
                  <option>10 輪</option>
                  <option>20 輪</option>
                  <option selected>50 輪</option>
                  <option>100 輪</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-dark-text-secondary">定期排程</label>
                <input type="checkbox" className="w-5 h-5" />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-dark-text-secondary">開啟通知</label>
                <input type="checkbox" className="w-5 h-5" checked />
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div>
              <textarea
                value={memory?.content || ''}
                className="w-full px-3 py-2 bg-dark-secondary rounded-lg border border-dark-divider text-dark placeholder-dark-text-secondary focus:outline-none focus:border-brand-purple min-h-64 resize-none font-mono text-sm"
                placeholder="# 長期記憶&#10;&#10;在此記錄 Agent 的長期記憶內容..."
              />
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-2">
              {[
                { name: 'read_folder', label: '讀取資料夾' },
                { name: 'create_note', label: '新增筆記' },
                { name: 'update_note', label: '更新筆記' },
                { name: 'create_chart', label: '新增圖表' },
                { name: 'web_search', label: '網路搜尋' },
                { name: 'fetch_stock_data', label: '抓取台股資料' },
              ].map((skill) => (
                <label key={skill.name} className="flex items-center gap-2 p-2 hover:bg-dark-secondary rounded-lg cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-dark">{skill.label}</span>
                </label>
              ))}
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-dark-text-secondary">已使用</span>
                  <span className="text-sm font-medium text-dark-text-secondary">預算</span>
                </div>
                <div className="text-2xl font-bold text-dark mb-1">
                  61 credits <span className="text-lg">—（未設定）</span>
                </div>
                <p className="text-sm text-dark-text-secondary">未設定預算</p>
              </div>

              <div>
                <p className="text-sm text-dark-text-secondary mb-3">過去 7 天平均消耗 8.7 credits / 天</p>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-text-secondary mb-2 block">
                  月預算（CREDITS）
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    defaultValue="0"
                    className="flex-1 px-3 py-2 bg-dark-secondary rounded-pill border border-dark-divider text-dark focus:outline-none focus:border-brand-purple"
                  />
                  <button className="px-4 py-2 bg-brand-purple text-white rounded-pill font-medium hover:bg-brand-purple-alt transition-colors">
                    更新預算
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

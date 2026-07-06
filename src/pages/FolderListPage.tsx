import React, { useState, useEffect } from 'react';
import { Agent, Folder } from '@/types';
import { agentApi } from '@/api/agentApi';
import { folderApi } from '@/api/folderApi';
import { AgentCard, FAB } from '@/components';

interface FolderListPageProps {
  folderId: string;
  onAgentSelect: (agentId: string) => void;
  onCreateAgent: () => void;
}

export const FolderListPage: React.FC<FolderListPageProps> = ({
  folderId,
  onAgentSelect,
  onCreateAgent,
}) => {
  const [folder, setFolder] = useState<Folder | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [folderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark">
        <div className="text-dark-text-secondary">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-dark-secondary rounded-lg transition-colors">
            ≡
          </button>
          <h1 className="text-2xl font-semibold text-dark">{folder?.name || 'Agents'}</h1>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 text-sm text-dark-text-secondary hover:text-dark transition-colors">
            新增模板
          </button>
          <button className="p-2 hover:bg-dark-secondary rounded-lg transition-colors">
            ↑
          </button>
          <button className="p-2 hover:bg-dark-secondary rounded-lg transition-colors">
            ...
          </button>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {agents.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <p className="text-dark-text-secondary mb-4">還沒有 AI 員工</p>
            <button
              onClick={onCreateAgent}
              className="px-4 py-2 bg-brand-purple text-white rounded-pill font-medium hover:bg-brand-purple-alt transition-colors"
            >
              建立第一個員工
            </button>
          </div>
        ) : (
          <>
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={() => onAgentSelect(agent.id)}
              />
            ))}
            {/* Add Agent Button */}
            <button
              onClick={onCreateAgent}
              className="min-h-24 bg-dark-secondary rounded-card border-2 border-dashed border-dark-divider hover:border-brand-purple transition-colors flex items-center justify-center"
            >
              <span className="text-2xl text-dark-text-secondary">＋ 新增員工</span>
            </button>
          </>
        )}
      </div>

      {/* FAB */}
      <FAB icon="⊡" label="新增員工" onClick={onCreateAgent} />
    </div>
  );
};

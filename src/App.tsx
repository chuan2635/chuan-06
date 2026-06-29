import React, { useState } from 'react';
import { FolderListPage, AgentDetailPage } from '@/pages';

export const App: React.FC = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [folderId] = useState('default-folder'); // 應該從路由或 context 獲取

  return (
    <div className="w-full h-full">
      <FolderListPage
        folderId={folderId}
        onAgentSelect={setSelectedAgentId}
        onCreateAgent={() => {
          // 開啟建立 Agent modal
          console.log('Create agent');
        }}
      />

      {selectedAgentId && (
        <AgentDetailPage
          agentId={selectedAgentId}
          onClose={() => setSelectedAgentId(null)}
        />
      )}
    </div>
  );
};

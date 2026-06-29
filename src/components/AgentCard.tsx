import React from 'react';
import { Agent } from '@/types';

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-dark-secondary hover:bg-dark-secondary/80 rounded-card p-4 border border-dark-divider transition-all text-left"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-dark mb-2">{agent.name}</h3>
          <div className="inline-block px-2 py-1 rounded-pill text-xs font-medium text-dark-text-secondary bg-dark-divider">
            開置
          </div>
        </div>
        <div className="text-2xl">{agent.avatar_icon || '🤖'}</div>
      </div>
    </button>
  );
};

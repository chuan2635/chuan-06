import React from 'react';
import { ExecutionLog } from '@/types';
import { Badge } from './Badge';

interface ExecutionLogsTableProps {
  logs: ExecutionLog[];
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
};

const formatTokens = (tokens: number) => {
  return `${(tokens / 1000).toFixed(1)}k`;
};

export const ExecutionLogsTable: React.FC<ExecutionLogsTableProps> = ({ logs }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dark-divider">
            <th className="text-left px-4 py-2 text-dark-text-secondary font-medium">日期</th>
            <th className="text-left px-4 py-2 text-dark-text-secondary font-medium">觸發原因</th>
            <th className="text-left px-4 py-2 text-dark-text-secondary font-medium">狀態</th>
            <th className="text-left px-4 py-2 text-dark-text-secondary font-medium">時長</th>
            <th className="text-left px-4 py-2 text-dark-text-secondary font-medium">Tokens</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-dark-divider hover:bg-dark-secondary/50">
              <td className="px-4 py-3 text-dark-text-secondary">{formatDate(log.started_at)}</td>
              <td className="px-4 py-3 text-dark-text-secondary capitalize">{log.triggered_by}</td>
              <td className="px-4 py-3">
                <Badge status={log.status} />
              </td>
              <td className="px-4 py-3 text-dark-text-secondary">
                {formatDuration(log.duration_seconds)}
              </td>
              <td className="px-4 py-3 text-dark-text-secondary">{formatTokens(log.tokens_used)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

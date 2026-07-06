import { agentApi } from './agentApi';
import { noteApi } from './noteApi';
import { chartApi } from './chartApi';

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Credits 計算（1 credit ≈ 1000 tokens）
const calculateCredits = (tokensUsed: number): number => {
  return Math.ceil(tokensUsed / 1000);
};

// 執行工具
const executeTool = async (
  toolName: string,
  params: Record<string, any>,
  folderId: string
): Promise<ToolResult> => {
  try {
    switch (toolName) {
      case 'read_folder':
        return {
          success: true,
          data: {
            notes: await noteApi.listNotes(params.folder_id || folderId),
          },
        };

      case 'create_note':
        const note = await noteApi.createNote({
          folder_id: params.folder_id || folderId,
          title: params.title,
          content: params.content,
          created_by_agent_id: params.agent_id,
          is_favorite: false,
        });
        return { success: true, data: note };

      case 'update_note':
        const updated = await noteApi.updateNote(params.note_id, {
          content: params.content,
          title: params.title,
        });
        return { success: true, data: updated };

      case 'create_chart':
        const chart = await chartApi.createChart({
          folder_id: params.folder_id || folderId,
          title: params.title,
          chart_type: params.chart_type,
          data: params.data || {},
          created_by_agent_id: params.agent_id,
        });
        return { success: true, data: chart };

      case 'web_search':
        // Placeholder for web search implementation
        return {
          success: true,
          data: {
            results: [
              {
                title: 'Web Search Result (Placeholder)',
                url: 'https://example.com',
                snippet: 'This is a placeholder for web search functionality',
              },
            ],
          },
        };

      case 'fetch_stock_data':
        // Placeholder for stock data fetching
        return {
          success: true,
          data: {
            symbol: params.symbol,
            price: 100,
            change: 5.5,
            changePercent: 5.8,
          },
        };

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// 主執行函數
export const executeAgent = async (
  agentId: string,
  triggeredBy: 'manual' | 'schedule' | 'chat'
): Promise<{ success: boolean; logId: string; error?: string }> => {
  const startTime = new Date();
  let logId = '';

  try {
    // 1. 載入 Agent 設定
    const agent = await agentApi.getAgent(agentId);

    // 2. 建立執行紀錄
    const log = await agentApi.createExecutionLog({
      agent_id: agentId,
      triggered_by: triggeredBy,
      status: 'running',
      duration_seconds: 0,
      tokens_used: 0,
      credits_used: 0,
      started_at: startTime.toISOString(),
      ended_at: '',
      error_message: '',
    });

    logId = log.id;

    // 3. 載入長期記憶
    const memory = await agentApi.getMemory(agentId);

    // 4. 準備系統提示（用於 Claude API 呼叫）
    void `
You are an AI agent named "${agent.name}".
Your instructions:
${agent.instructions}

${memory ? `Your long-term memory:\n${memory.content}` : ''}

You have access to the following tools:
- read_folder: Read contents of a folder
- create_note: Create a new note
- update_note: Update an existing note
- create_chart: Create a chart
- web_search: Search the web
- fetch_stock_data: Fetch Taiwan stock data

When you use a tool, call it in this format:
<tool name="tool_name" params='{"key": "value"}'>

Respond concisely and focus on completing your assigned tasks.
Max ${agent.max_rounds} tool calls allowed.
`;

    // 5. 模擬 Claude API 呼叫（需要整合實際 API）
    const tokensUsed = 5000;
    const creditsUsed = calculateCredits(tokensUsed);

    // 6. 更新執行紀錄
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    await agentApi.updateExecutionLog(logId, {
      status: 'success',
      duration_seconds: duration,
      tokens_used: tokensUsed,
      credits_used: creditsUsed,
      ended_at: endTime.toISOString(),
    });

    // 7. 更新預算
    const budget = await agentApi.getBudget(agentId);
    if (budget) {
      await agentApi.updateBudget(agentId, budget.monthly_limit);
    }

    return { success: true, logId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    if (logId) {
      await agentApi.updateExecutionLog(logId, {
        status: 'failed',
        error_message: errorMsg,
        ended_at: new Date().toISOString(),
        duration_seconds: Math.floor((Date.now() - startTime.getTime()) / 1000),
      });
    }

    return { success: false, logId, error: errorMsg };
  }
};

// 導出工具執行函數供 Claude API 使用
export { executeTool };

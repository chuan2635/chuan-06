import { CLAUDE_TOOLS, ContentBlock, getClaudeClient } from './claudeTools';
import { executeTool } from './agentExecutor';

interface AgentExecutionContext {
  agentId: string;
  agentName: string;
  instructions: string;
  memory: string;
  folderId: string;
  maxRounds: number;
}

interface ExecutionResult {
  success: boolean;
  messages: ContentBlock[];
  totalTokens: number;
  error?: string;
}

export const executeAgentWithClaude = async (
  context: AgentExecutionContext
): Promise<ExecutionResult> => {
  const client = getClaudeClient();
  let totalTokens = 0;
  let allContentBlocks: ContentBlock[] = [];

  // 構建系統提示
  const systemPrompt = `You are an AI agent named "${context.agentName}".

Your responsibilities:
${context.instructions}

${context.memory ? `Your long-term memory and context:\n${context.memory}` : ''}

You have access to several tools to help you complete your tasks. Use them strategically.
Focus on completing your assigned tasks efficiently.`;

  // 初始用戶消息
  const userMessage = `Please execute your assigned tasks now. You have up to ${context.maxRounds} tool calls available.`;

  let currentMessages: Array<{ role: string; content: any }> = [
    {
      role: 'user',
      content: userMessage,
    },
  ];

  let roundCount = 0;

  while (roundCount < context.maxRounds) {
    try {
      // 呼叫 Claude API
      const response = await (client as any).messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        tools: CLAUDE_TOOLS as unknown as any[],
        messages: currentMessages as any,
      });

      // 累積 tokens
      totalTokens += response.usage.input_tokens + response.usage.output_tokens;

      // 處理響應
      const toolResults: any[] = [];
      let hasToolUse = false;

      for (const block of response.content) {
        if (block.type === 'text') {
          allContentBlocks.push({
            type: 'text',
            text: (block as any).text,
          });
        } else if (block.type === 'tool_use') {
          hasToolUse = true;
          allContentBlocks.push({
            type: 'tool_use',
            id: (block as any).id,
            name: (block as any).name,
            input: (block as any).input as Record<string, any>,
          });

          // 執行工具
          const result = await executeTool(
            (block as any).name,
            (block as any).input as Record<string, any>,
            context.folderId
          );

          // 準備工具結果回覆
          toolResults.push({
            type: 'tool_result',
            tool_use_id: (block as any).id,
            content: JSON.stringify(result),
          });
        }
      }

      // 如果沒有工具呼叫，表示 Agent 完成
      if (!hasToolUse) {
        break;
      }

      // 添加助手回應到消息歷史
      currentMessages.push({
        role: 'assistant',
        content: response.content,
      });

      // 添加工具結果
      currentMessages.push({
        role: 'user',
        content: toolResults,
      });

      roundCount++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error in Claude API call: ${errorMessage}`);

      return {
        success: false,
        messages: allContentBlocks,
        totalTokens,
        error: errorMessage,
      };
    }
  }

  return {
    success: true,
    messages: allContentBlocks,
    totalTokens,
  };
};

// 簡化的同步執行函數
export const executeAgentSync = async (
  agentId: string,
  agentName: string,
  instructions: string,
  memory: string,
  folderId: string,
  maxRounds: number = 50
): Promise<ExecutionResult> => {
  const context: AgentExecutionContext = {
    agentId,
    agentName,
    instructions,
    memory,
    folderId,
    maxRounds,
  };

  return executeAgentWithClaude(context);
};

import Anthropic from '@anthropic-ai/sdk';
// 工具定義（符合 Claude API 格式）
export const CLAUDE_TOOLS = [
    {
        name: 'read_folder',
        description: '讀取指定資料夾的所有筆記、待辦、圖表內容',
        input_schema: {
            type: 'object',
            properties: {
                folder_id: {
                    type: 'string',
                    description: 'The folder ID to read from',
                },
            },
            required: ['folder_id'],
        },
    },
    {
        name: 'create_note',
        description: '新增筆記到指定資料夾',
        input_schema: {
            type: 'object',
            properties: {
                folder_id: {
                    type: 'string',
                    description: 'The folder ID',
                },
                title: {
                    type: 'string',
                    description: 'Note title',
                },
                content: {
                    type: 'string',
                    description: 'Note content in Markdown format',
                },
            },
            required: ['folder_id', 'title', 'content'],
        },
    },
    {
        name: 'update_note',
        description: '更新既有筆記',
        input_schema: {
            type: 'object',
            properties: {
                note_id: {
                    type: 'string',
                    description: 'The note ID to update',
                },
                title: {
                    type: 'string',
                    description: 'New note title',
                },
                content: {
                    type: 'string',
                    description: 'New note content in Markdown format',
                },
            },
            required: ['note_id', 'content'],
        },
    },
    {
        name: 'create_todo',
        description: '新增待辦事項',
        input_schema: {
            type: 'object',
            properties: {
                folder_id: {
                    type: 'string',
                    description: 'The folder ID',
                },
                title: {
                    type: 'string',
                    description: 'Todo title',
                },
                description: {
                    type: 'string',
                    description: 'Todo description (optional)',
                },
                priority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high'],
                    description: 'Priority level',
                },
            },
            required: ['folder_id', 'title'],
        },
    },
    {
        name: 'create_chart',
        description: '新增圖表',
        input_schema: {
            type: 'object',
            properties: {
                folder_id: {
                    type: 'string',
                    description: 'The folder ID',
                },
                title: {
                    type: 'string',
                    description: 'Chart title',
                },
                chart_type: {
                    type: 'string',
                    enum: ['line', 'bar', 'pie', 'scatter', 'area'],
                    description: 'Type of chart',
                },
                data: {
                    type: 'object',
                    description: 'Chart data in Recharts format',
                },
            },
            required: ['folder_id', 'title', 'chart_type', 'data'],
        },
    },
    {
        name: 'web_search',
        description: '搜尋網路資訊',
        input_schema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query',
                },
                limit: {
                    type: 'number',
                    description: 'Number of results (default: 10)',
                },
            },
            required: ['query'],
        },
    },
    {
        name: 'fetch_stock_data',
        description: '抓取台股資料（收盤價、漲跌幅、成交量等）',
        input_schema: {
            type: 'object',
            properties: {
                symbol: {
                    type: 'string',
                    description: 'Stock symbol (e.g., "2330" for TSMC)',
                },
                date_range: {
                    type: 'string',
                    description: 'Date range (e.g., "7d", "30d", "1y")',
                },
            },
            required: ['symbol'],
        },
    },
];
// Claude API 客戶端初始化
export const getClaudeClient = () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not set');
    }
    return new Anthropic({ apiKey });
};
// 處理工具呼叫結果
export const processToolResult = (toolName, toolUseId, result) => {
    return {
        tool_name: toolName,
        tool_use_id: toolUseId,
        result: JSON.stringify(result),
    };
};

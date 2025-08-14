import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  searchProductSchema,
  authSchema,
  searchTransactionHistorySchema,
  provideVerificationCodeSchema,
} from './schemas/index.js';
import {
  searchProductTool,
  authTool,
  searchTransactionHistoryTool,
  provideVerificationCodeTool,
} from './tools/index.js';

// Global session manager
const activeSessions = new Map();

const server = new Server(
  {
    name: 'ecommerce-demo',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      searchProductSchema,
      authSchema,
      searchTransactionHistorySchema,
      provideVerificationCodeSchema,
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'search_product') {
    return await searchProductTool(args);
  }

  if (name === 'auth') {
    return await authTool(args, activeSessions);
  }

  if (name === 'search_transaction_history') {
    return await searchTransactionHistoryTool(args, activeSessions);
  }

  if (name === 'provide_verification_code') {
    return await provideVerificationCodeTool(args, activeSessions);
  }

  throw new Error(`Tool ${name} not found`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Ecommerce MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

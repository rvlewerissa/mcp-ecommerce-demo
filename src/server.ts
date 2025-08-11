#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { products } from './data';

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
      {
        name: 'get_products',
        description:
          'Get a list of all available products in the ecommerce store',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;

  if (name === 'get_products') {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(products, null, 2),
        },
      ],
    };
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

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { searchTokopediaScrape } from './scrape/search-tokopedia.js';

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
        name: 'search_product',
        description: 'Search for products in Tokopedia by name or description',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'Search query to match against product name or description',
            },
            discount: {
              type: 'boolean',
              description: 'Filter to show only discounted products',
            },
            preorder: {
              type: 'boolean',
              description: 'Filter to show only preorder products',
            },
            ready_stock: {
              type: 'boolean',
              description:
                'Filter to show only ready stock products (opposite of preorder)',
            },
            condition: {
              type: 'number',
              description:
                'Filter by item condition: 1 for new items, 2 for used items',
              enum: [1, 2],
            },
            order_by: {
              type: 'string',
              description: 'Order search results by criteria',
              enum: [
                'relevant',
                'rating',
                'newest',
                'highest_price',
                'lowest_price',
              ],
            },
            min_price: {
              type: 'number',
              description: 'Minimum price filter',
            },
            max_price: {
              type: 'number',
              description: 'Maximum price filter',
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments } = request.params;

  if (name === 'search_product') {
    const {
      query,
      discount,
      preorder,
      ready_stock,
      condition,
      order_by,
      min_price,
      max_price,
    } = arguments || {};

    if (!query) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify([], null, 2),
          },
        ],
      };
    }

    try {
      const scrapedProducts = await searchTokopediaScrape({
        query,
        discount,
        preorder,
        ready_stock,
        condition,
        order_by,
        min_price,
        max_price,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(scrapedProducts, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: error.message }, null, 2),
          },
        ],
      };
    }
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

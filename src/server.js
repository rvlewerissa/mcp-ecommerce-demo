import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { searchTokopediaScrape } from './scrape/search-tokopedia.js';
import { auth, verificationCode } from './scrape/auth.js';
import { transactionHistory } from './scrape/transaction-history.js';

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
      {
        name: 'auth',
        description:
          'Authenticate to Tokopedia using user credentials (requires actual email and password from user)',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'Email address for Tokopedia login',
            },
            password: {
              type: 'string',
              description: 'Password for Tokopedia login',
            },
          },
          required: ['email', 'password'],
        },
      },
      {
        name: 'search_transaction_history',
        description:
          'Search transaction history in Tokopedia (requires active session from auth tool)',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description:
                'Session ID from successful authentication (obtained from auth tool)',
            },
          },
          required: ['session_id'],
        },
      },
      {
        name: 'provide_verification_code',
        description:
          'Provide verification code to continue authentication process',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description:
                'Session ID from auth tool that requested verification',
            },
            verification_code: {
              type: 'string',
              description: 'Verification code received via email or SMS',
            },
          },
          required: ['session_id', 'verification_code'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

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
    } = args || {};

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

  if (name === 'auth') {
    const { email, password } = args || {};

    if (!email || !password) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { error: 'Email and password are required' },
              null,
              2
            ),
          },
        ],
      };
    }

    try {
      const authResult = await auth({
        email,
        password,
        sessionManager: activeSessions,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(authResult, null, 2),
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

  if (name === 'search_transaction_history') {
    const { session_id } = args || {};

    if (!session_id) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error:
                  'Session ID is required. Please authenticate first using the auth tool to get a session ID.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    try {
      // Get the authenticated session
      const session = activeSessions.get(session_id);
      if (!session) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error:
                    'Session not found or expired. Please authenticate again.',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Check if session is authenticated
      if (session.type !== 'authenticated') {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error:
                    'Session is not authenticated. Please complete authentication first.',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Call transaction history function
      const result = await transactionHistory({
        session,
        sessionId: session_id,
        sessionManager: activeSessions,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
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

  if (name === 'provide_verification_code') {
    const { session_id, verification_code } = args || {};

    if (!session_id || !verification_code) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Both session_id and verification_code are required',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Check if session exists
    const session = activeSessions.get(session_id);
    if (!session) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error:
                  'Session not found. Please start authentication process again.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    try {
      // Continue authentication with verification code
      const result = await verificationCode({
        session,
        sessionId: session_id,
        verificationCode: verification_code,
        sessionManager: activeSessions,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
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

export const searchProductSchema = {
  name: 'search_product',
  description: 'Search for products in Tokopedia by name or description',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query to match against product name or description',
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
        description: 'Filter to show only ready stock products (opposite of preorder)',
      },
      condition: {
        type: 'number',
        description: 'Filter by item condition: 1 for new items, 2 for used items',
        enum: [1, 2],
      },
      order_by: {
        type: 'string',
        description: 'Order search results by criteria',
        enum: ['relevant', 'rating', 'newest', 'highest_price', 'lowest_price'],
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
};
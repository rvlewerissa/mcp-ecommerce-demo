import { searchTokopedia } from '../scrape/search-tokopedia.js';

export async function searchProductTool(args) {
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
    const scrapedProducts = await searchTokopedia({
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
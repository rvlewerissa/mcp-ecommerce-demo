async function searchTokopediaScrape({
  query = 'laptop',
  discount = false,
  preorder = false,
  ready_stock = true,
  condition = null,
  order_by = 'relevant',
  min_price = null,
  max_price = null,
}) {
  const { addExtra } = await import('playwright-extra');
  const { chromium } = await import('playwright');
  const StealthPlugin = (await import('puppeteer-extra-plugin-stealth'))
    .default;

  // Add stealth plugin to playwright
  const playwrightExtra = addExtra(chromium);
  playwrightExtra.use(StealthPlugin());

  const browser = await playwrightExtra.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to Tokopedia search page
    const searchUrl = new URL('https://www.tokopedia.com/search');
    searchUrl.searchParams.set('q', query);
    if (discount) {
      searchUrl.searchParams.set('is_discount', 'true');
    }
    if (ready_stock) {
      searchUrl.searchParams.set('preorder', 'false');
    }
    if (preorder) {
      searchUrl.searchParams.set('preorder', 'true');
    }
    if (condition) {
      searchUrl.searchParams.set('condition', condition.toString());
    }

    // Set order by parameter
    const orderByMapping = {
      relevant: '23',
      rating: '5',
      newest: '9',
      highest_price: '4',
      lowest_price: '3',
    };
    const obValue = orderByMapping[order_by] || '23';
    searchUrl.searchParams.set('ob', obValue);

    // Set price filters
    if (min_price !== null && min_price !== undefined) {
      searchUrl.searchParams.set('pmin', min_price.toString());
    }
    if (max_price !== null && max_price !== undefined) {
      searchUrl.searchParams.set('pmax', max_price.toString());
    }

    await page.goto(searchUrl.toString(), {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for search results to load
    await page.waitForSelector('[data-testid="divSRPContentProducts"]', {
      timeout: 10000,
    });

    // Extract product data
    const products = await page.evaluate(() => {
      const container = document.querySelector(
        '[data-testid="divSRPContentProducts"]'
      );
      const results = [];

      for (let i = 0; i < container.children.length; i++) {
        const rowsWrapper = container.children[i];
        if (!rowsWrapper) continue;

        for (let x = 0; x < rowsWrapper.children.length; x++) {
          const productCard = rowsWrapper.children[x];
          if (!productCard) continue;

          try {
            const image =
              productCard.querySelector('img[alt="product-image"]')?.src || '';

            const link = productCard.querySelector('a')?.href || '';

            const linkElement = productCard.querySelector('a');
            if (!linkElement) continue;

            const name =
              linkElement?.children[0]?.children[1]?.children[0]?.textContent?.trim() ||
              '';

            const price =
              linkElement?.children[0]?.children[1]?.children[1]?.textContent?.trim() ||
              '';

            if (name || price || image || link) {
              results.push({
                name,
                price,
                image,
                link,
              });
            }
          } catch (error) {
            console.log('Error processing product card:', error.message);
            continue;
          }
        }
      }

      return results;
    });

    return products;
  } catch (error) {
    return {
      error: true,
      message: error.message,
      products: [],
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  searchTokopediaScrape({})
    .then((products) => {
      console.log(products);
      process.exit(0);
    })
    .catch((error) => {
      console.log(error);
      process.exit(1);
    });
}

export { searchTokopediaScrape };

async function transactionHistory({ session, sessionId, sessionManager } = {}) {
  const { page, server, browser, email } = session;

  try {
    // Navigate to Tokopedia order list page
    await page.goto('https://www.tokopedia.com/order-list', {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    await page.waitForLoadState('networkidle');

    // Wait for order items to load and extract real data
    let transactions = [];
    try {
      await page.waitForSelector('div[data-testid^="orderItem-"]', {
        timeout: 10000,
      });
    } catch (error) {
      return {
        success: true,
        message: 'No transactions found on order list page',
        transactions: [],
        totalTransactions: 0,
      };
    }

    // Get all order items
    const orderItems = await page.$$('div[data-testid^="orderItem-"]');

    // Extract data from each orderItem
    transactions = await Promise.all(
      orderItems.map(async (item, index) => {
        try {
          const nameElement = await item.$('h6');
          const itemName = nameElement
            ? await nameElement.textContent()
            : 'Unknown Item';

          return {
            name: itemName,
          };
        } catch (error) {
          return {
            id: `error_${index}`,
            name: 'Error extracting item',
            error: error.message,
          };
        }
      })
    );

    return {
      success: true,
      message: `Successfully retrieved ${transactions.length} transactions`,
      transactions,
      totalTransactions: transactions.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  } finally {
    // Clean up session and stop server
    if (sessionManager && sessionId) {
      sessionManager.delete(sessionId);
    }

    await server.stop();
  }
}

export { transactionHistory };

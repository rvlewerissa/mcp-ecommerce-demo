async function loginTokopediaScrape() {
  const { addExtra } = await import('playwright-extra');
  const { chromium } = await import('playwright');
  const StealthPlugin = (await import('puppeteer-extra-plugin-stealth'))
    .default;

  // Add stealth plugin to playwright
  const playwrightExtra = addExtra(chromium);
  const stealth = StealthPlugin({
    availableEvasions: [
      'navigator.webdriver', // Essential
      'navigator.plugins', // Safe
      'navigator.languages', // Safe
      'chrome.runtime', // Safe
      // Remove these problematic ones:
      // 'navigator.permissions',
      // 'window.outerdimensions',
      // 'media.codecs',
    ],
  });

  playwrightExtra.use(stealth);

  const browser = await playwrightExtra.launch({
    headless: false,
    // args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-http2'],
  });

  try {
    const context = await browser.newContext();

    const page = await context.newPage();

    await page.addInitScript(() => {
      // Wait for stealth to finish, then restore inputs
      setTimeout(() => {
        console.log('Restoring input functionality...');

        document.querySelectorAll('input').forEach((input) => {
          // Remove stealth's event listeners by cloning
          const newInput = input.cloneNode(true);
          input.parentNode.replaceChild(newInput, input);

          // Ensure it's clickable
          newInput.style.pointerEvents = 'auto';
          newInput.disabled = false;
          newInput.readOnly = false;
        });

        console.log('Inputs restored - you can click manually now');
      }, 3000);
    });

    // Navigate to Tokopedia login page
    await page.goto('https://www.tokopedia.com', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for login page to fully load including JavaScript framework
    await page.waitForLoadState('networkidle');

    // Wait for the login input to be present and enabled
    const emailInput = await page.waitForSelector('input[name="login"]', {
      timeout: 15000,
    });

    // Wait for framework to fully initialize
    await page.waitForTimeout(5000);
    console.log('Framework initialization wait complete');

    // Focus and fill the input using Playwright methods
    await emailInput.focus();
    await emailInput.fill('rvlewerissa21@gmail.com');
    console.log('Input filled using Playwright methods');

    // Click "Selanjutnya" button
    const nextButton = await page.waitForSelector(
      'button[data-testid="button-submit"]',
      {
        timeout: 5000,
      }
    );
    await nextButton.click();

    // Wait for navigation or next step
    await page.waitForLoadState('networkidle');

    // Get current state
    const title = await page.title();
    const url = page.url();

    return {
      success: true,
      title,
      url,
      message: 'Successfully filled email and clicked Selanjutnya',
    };
  } catch (error) {
    return {
      success: false,
      error: true,
      message: error.message,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  loginTokopediaScrape()
    .then((result) => {
      console.log(result);
      process.exit(0);
    })
    .catch((error) => {
      console.log(error);
      process.exit(1);
    });
}

export { loginTokopediaScrape };

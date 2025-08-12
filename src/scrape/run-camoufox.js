import { firefox } from 'playwright';
import { fileURLToPath } from 'url';
import { CamoufoxServer } from '../camoufox/CamoufoxServer.js';
import fs from 'fs';
import path from 'path';

const debug = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

async function runExample() {
  const server = new CamoufoxServer({
    headless: false,
    humanize: true,
    debug: false,
  });

  try {
    debug('Starting server...');
    const wsEndpoint = await server.start();

    debug('Connecting to browser...');
    const browser = await firefox.connect(wsEndpoint);

    server.setBrowser(browser);

    const page = await browser.newPage();

    // Navigate to Tokopedia login page
    await page.goto('https://www.tokopedia.com/login');

    // Wait for the login input to be present and enabled
    const emailInput = await page.waitForSelector('input[name="login"]', {
      timeout: 15000,
    });

    await emailInput.focus();
    await emailInput.fill('rvlewerissa21@gmail.com');

    const submitButton = await page.waitForSelector(
      'button[data-testid="button-submit"]',
      {
        timeout: 5000,
      }
    );
    await submitButton.click();

    // Wait for navigation or next step
    await page.waitForLoadState('networkidle');

    // Look for password input and fill it
    const passwordInput = await page.waitForSelector('input[type="password"]', {
      timeout: 5000,
    });

    await passwordInput.focus();
    await passwordInput.fill('4gTx!Z&O');
    debug('Password filled');

    // Find the submit button for password step
    const submitPasswordButton = await page.waitForSelector(
      'button[data-testid="button-submit"]',
      {
        timeout: 5000,
      }
    );

    await submitPasswordButton.click();

    // Wait for page to load after password submission
    await page.waitForLoadState('networkidle');

    // Check if verification code page appears
    const headerContent = await page.textContent('div.header');
    if (headerContent && headerContent.includes('Masukkan Kode Verifikasi')) {
      debug('Verification code page detected');
      return {
        success: false,
        needsVerification: true,
        message:
          'Please provide the verification code sent to your email or phone',
      };
    } else {
      debug('No verification code page detected');
    }

    await page.waitForTimeout(60000);

    const title = await page.title();
    const url = page.url();

    return {
      success: true,
      title,
      url,
    };
  } catch (error) {
    debug(`Error: ${error.message}`);
    throw error;
  } finally {
    debug('Stopping server and browser...');
    await server.stop();
    debug('Cleanup completed');
  }
}

runExample().catch(console.error);

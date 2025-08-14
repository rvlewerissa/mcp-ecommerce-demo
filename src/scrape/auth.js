import { firefox } from 'playwright';
import { CamoufoxServer } from '../camoufox/CamoufoxServer.js';

async function auth({ email, password, sessionManager } = {}) {
  const server = new CamoufoxServer({
    headless: true,
    humanize: true,
    debug: false,
  });
  let sessionStored = false;
  try {
    const sessionId = `auth_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const wsEndpoint = await server.start();
    const browser = await firefox.connect(wsEndpoint);
    server.setBrowser(browser);

    const page = await browser.newPage();
    await page.goto('https://www.tokopedia.com/login');

    // Look for email input and fill it
    const emailInput = await page.waitForSelector('input[name="login"]', {
      timeout: 15000,
    });
    await emailInput.focus();
    await emailInput.fill(email);

    // Find the submit button and click it
    const submitButton = await page.waitForSelector(
      'button[data-testid="button-submit"]',
      {
        timeout: 5000,
      }
    );
    await submitButton.click();
    await page.waitForLoadState('networkidle');

    // Look for password input and fill it
    const passwordInput = await page.waitForSelector('input[type="password"]', {
      timeout: 5000,
    });
    await passwordInput.focus();
    await passwordInput.fill(password);

    // Find the submit button and click it
    const submitPasswordButton = await page.waitForSelector(
      'button[data-testid="button-submit"]',
      {
        timeout: 5000,
      }
    );
    await submitPasswordButton.click();

    await page.waitForLoadState('networkidle');

    // Check if verification code page appears
    const headerContent = await page.textContent('div.header');
    if (headerContent && headerContent.includes('Masukkan Kode Verifikasi')) {
      // Store session type to verification_pending
      sessionManager.set(sessionId, {
        server,
        browser,
        page,
        email,
        type: 'verification_pending',
      });
      sessionStored = true;

      return {
        success: false,
        needsVerification: true,
        sessionId,
        message:
          'Please provide the verification code using the provide_verification_code tool with this session ID',
      };
    } else {
      // Store session type to authenticated
      sessionManager.set(sessionId, {
        server,
        browser,
        page,
        email,
        type: 'authenticated',
      });
      sessionStored = true;

      return {
        success: true,
        message:
          'Authentication completed successfully. You can now use search_transaction_history.',
        sessionId: sessionId,
      };
    }

    return {
      success: true,
    };
  } finally {
    // Cleanup if no session is stored or on error
    if (!sessionStored) {
      await server.stop();
    }
  }
}

async function verificationCode({
  session,
  sessionId,
  verificationCode,
  sessionManager,
} = {}) {
  const { page, server, browser, email } = session;

  try {
    const otpInput = await page.waitForSelector('input[type="tel"]', {
      timeout: 10000,
    });
    await otpInput.focus();
    await otpInput.fill(verificationCode);

    // Wait for page to navigate after verification code input
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if verification was not successful
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await otpInput.fill('');
      return {
        success: false,
        message:
          'Verification code failed - please check the code and try again',
        url: currentUrl,
        sessionId: null,
      };
    }

    // Update the existing session type to authenticated
    sessionManager.set(sessionId, {
      server,
      browser,
      page,
      email,
      type: 'authenticated',
    });

    return {
      success: true,
      message:
        'Authentication completed successfully. You can now use search_transaction_history.',
      url: currentUrl,
      sessionId: sessionId,
    };
  } catch (error) {
    // Clean up session on error
    if (sessionManager && sessionId) {
      sessionManager.delete(sessionId);
    }
    await server.stop();
    throw error;
  }
}

export { auth, verificationCode };

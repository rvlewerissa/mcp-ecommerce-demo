import { firefox } from 'playwright';
import { CamoufoxServer } from '../camoufox/CamoufoxServer.js';

async function auth({ email, password, sessionManager } = {}) {
  const server = new CamoufoxServer({
    headless: true,
    humanize: true,
    debug: false,
  });
  try {
    let sessionStored = false;

    const sessionId = `auth_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const wsEndpoint = await server.start();
    const browser = await firefox.connect(wsEndpoint);
    server.setBrowser(browser);

    const page = await browser.newPage();
    await page.goto('https://www.tokopedia.com/login');

    // Wait for the login input to be present and enabled
    const emailInput = await page.waitForSelector('input[name="login"]', {
      timeout: 15000,
    });

    await emailInput.focus();
    await emailInput.fill(email);

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

    // Find the submit button for password step
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
      // Store session for later use
      sessionManager.set(sessionId, {
        server,
        browser,
        page,
        email,
        type: 'verification_pending',
      });

      return {
        success: false,
        needsVerification: true,
        sessionId,
        message:
          'Please provide the verification code using the provide_verification_code tool with this session ID',
      };

      return {
        success: false,
        needsVerification: true,
        message:
          'Please provide the verification code sent to your email or phone',
      };
    } else {
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
        sessionId: sessionId,
      };
    }

    sessionStored = true;

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
    // Find and fill the OTP input field
    const otpInput = await page.waitForSelector('input[type="tel"]', {
      timeout: 10000,
    });

    await otpInput.focus();
    await otpInput.fill(verificationCode);

    // Wait for page to navigate after verification code input
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if login was successful by checking URL change or success indicators
    const currentUrl = page.url();

    // Check if verification was not successful
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

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  auth().catch(console.error);
}

export { auth, verificationCode };

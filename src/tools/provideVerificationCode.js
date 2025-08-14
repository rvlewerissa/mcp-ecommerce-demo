import { verificationCode } from '../scrape/auth.js';

export async function provideVerificationCodeTool(args, activeSessions) {
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
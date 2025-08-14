import { auth } from '../scrape/auth.js';

export async function authTool(args, activeSessions) {
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
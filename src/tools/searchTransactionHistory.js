import { transactionHistory } from '../scrape/transaction-history.js';

export async function searchTransactionHistoryTool(args, activeSessions) {
  const { session_id } = args || {};

  if (!session_id) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error:
                'Session ID is required. Please authenticate first using the auth tool to get a session ID.',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  try {
    // Get the authenticated session
    const session = activeSessions.get(session_id);
    if (!session) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error:
                  'Session not found or expired. Please authenticate again.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Check if session is authenticated
    if (session.type !== 'authenticated') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error:
                  'Session is not authenticated. Please complete authentication first.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Call transaction history function
    const result = await transactionHistory({
      session,
      sessionId: session_id,
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
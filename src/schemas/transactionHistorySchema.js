export const transactionHistorySchema = {
  name: 'search_transaction_history',
  description:
    'Search transaction history in Tokopedia (requires active session from auth tool)',
  inputSchema: {
    type: 'object',
    properties: {
      session_id: {
        type: 'string',
        description:
          'Session ID from successful authentication (obtained from auth tool)',
      },
    },
    required: ['session_id'],
  },
};

export const authSchema = {
  name: 'auth',
  description: 'Authenticate to Tokopedia using real user credentials (requires actual email and password from user)',
  inputSchema: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description: 'Email address for Tokopedia login',
      },
      password: {
        type: 'string',
        description: 'Password for Tokopedia login',
      },
    },
    required: ['email', 'password'],
  },
};
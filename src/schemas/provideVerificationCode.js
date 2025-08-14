export const provideVerificationCodeSchema = {
  name: 'provide_verification_code',
  description: 'Provide verification code to continue authentication process',
  inputSchema: {
    type: 'object',
    properties: {
      session_id: {
        type: 'string',
        description: 'Session ID from auth tool that requested verification',
      },
      verification_code: {
        type: 'string',
        description: 'Verification code received via email or SMS',
      },
    },
    required: ['session_id', 'verification_code'],
  },
};
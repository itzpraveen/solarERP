// client-new/.eslintrc.js
module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'eslint-config-prettier', // Disables ESLint rules that conflict with Prettier
  ],
  plugins: [
    'prettier', // Explicitly enable prettier plugin
  ],
  rules: {
    'prettier/prettier': 'error', // Report prettier rule violations as errors
    // Add any other client-specific rules here if needed
  },
};
// .eslintrc.js
module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    jest: true, // Added because Jest is a dev dependency
  },
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended', // Integrates Prettier with ESLint
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  plugins: [
    'prettier',
  ],
  rules: {
    'prettier/prettier': ['error', { "endOfLine": "auto" }], // Report Prettier rule violations as ESLint errors, handle line endings automatically
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // Allow console logs in development
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warn about unused vars, allow underscore prefix
    'import/prefer-default-export': 'off', // Allow named exports
    'class-methods-use-this': 'off', // Allow class methods that don't use 'this'
    // Add any other project-specific rule overrides here
  },
  ignorePatterns: [
    'node_modules/',
    'build/',
    'dist/',
    'coverage/',
    'client-new/', // Ignore the frontend directory
    'uploads/', // Ignore uploads directory
    '*.html', // Ignore html files in root
    '*.md', // Ignore markdown files
    'Dockerfile',
    'docker-compose.yml',
    'Procfile',
    '.env',
    'fix-linting.sh', // Ignore shell script
  ],
};
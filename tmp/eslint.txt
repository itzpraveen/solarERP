// .eslintrc.js
module.exports = {
  root: true,
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'no-underscore-dangle': 'off', // Allow dangling underscores (e.g., for _id)
  },
  ignorePatterns: [
    'node_modules/',
    'client-new/**',
    'build/',
    'dist/',
    'coverage/',
    'client-new/build/',
    'uploads/',
    '*.html',
    '*.md',
    'Dockerfile',
    'docker-compose.yml',
    'Procfile',
    '.env',
    'fix-linting.sh',
  ],
};

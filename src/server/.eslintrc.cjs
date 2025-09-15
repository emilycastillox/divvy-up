module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Basic rules
    'no-console': 'off', // Allow console in server code
    'no-debugger': 'error',
    'no-unused-vars': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    
        // Code style
        'indent': 'off', // Disabled due to conflict with Prettier
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': 'off', // Handled by Prettier
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
  ],
};

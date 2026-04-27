module.exports = {
  root: true,
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    // Prevent the exact class of bug that caused the RootLayoutInner incident
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-undef': 'off', // TypeScript handles this

    // React / React Native quality
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error', // Catches the MEMORIES hooks violation
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.expo/',
    'scripts/',
    'src/data/seed-*.ts', // seed data files have intentional any types
  ],
};

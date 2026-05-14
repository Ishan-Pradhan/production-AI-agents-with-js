import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts'],

    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },

      globals: {
        ...globals.node,
      },
    },

    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },

  eslintConfigPrettier,

  {
    ignores: ['dist', 'node_modules'],
  },
];
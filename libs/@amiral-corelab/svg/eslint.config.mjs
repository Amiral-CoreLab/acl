// @ts-check
import { defineConfig } from 'eslint/config';
import rootConfig from '../../../eslint.config.mjs';

export default defineConfig([
  ...rootConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'acl',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'acl',
          style: 'kebab-case',
        },
      ],
      '@typescript-eslint/no-magic-numbers': 'off',
      complexity: 'off',
      'max-lines-per-function': 'off',
      'max-lines': 'off',
    },
  },
  {
    files: ['**/services/**/*.ts'],
    rules: {
      '@typescript-eslint/class-methods-use-this': 'off',
    },
  },
  {
    files: ['**/*.html'],
    rules: {},
  },
]);

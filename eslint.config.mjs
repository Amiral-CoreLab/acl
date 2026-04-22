import js from '@eslint/js';
import ts from 'typescript-eslint';
import angular from 'angular-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.ts', '**/*.html'],
    extends: [prettier],
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleAttributePerLine: true,
        },
      ],
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    extends: [js.configs.all, ...ts.configs.all, ...angular.configs.tsAll],
    processor: angular.processInlineTemplates,
    rules: {
      'sort-keys': 'off',
      '@angular-eslint/use-component-view-encapsulation': 'off',
      'new-cap': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      'one-var': 'off',
      '@typescript-eslint/member-ordering': 'off',
      '@typescript-eslint/naming-convention': 'off',
      'no-duplicate-imports': 'off',
      'sort-imports': 'off',
      'no-undefined': 'off',
      'id-length': 'off',
      'no-ternary': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      'no-extra-boolean-cast': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      'max-statements': 'off',
      '@typescript-eslint/max-params': 'off',
      'no-multi-assign': 'off',
      'no-continue': 'off',
      '@typescript-eslint/init-declarations': 'off',
      'no-void': ['error', { allowAsStatement: true }],
      'func-style': ['error', 'declaration'],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateAll],
    rules: {
      '@angular-eslint/template/i18n': 'off',
      '@angular-eslint/template/no-call-expression': 'off',
      '@angular-eslint/template/prefer-static-string-properties': 'off',
    },
  },
]);

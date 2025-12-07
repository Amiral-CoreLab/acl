// @ts-check
import ts from 'typescript-eslint';
import root from '../../../eslint.config.mjs';

export default ts.config(
  ...root,
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
    },
  },
  {
    files: ['**/*.component.html'],
    rules: {},
  },
);

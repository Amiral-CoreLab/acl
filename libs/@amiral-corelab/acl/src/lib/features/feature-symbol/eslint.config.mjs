// @ts-check
import ts from 'typescript-eslint';
import root from '../../../../eslint.config.mjs';

export default ts.config(
  ...root,
  {
    files: ['**/*.ts'],
    ignores: ['feature-symbol.component.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'acl-feature-symbol',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'acl-feature-symbol',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    rules: {
      '@angular-eslint/template/interactive-supports-focus': ['off'],
      '@angular-eslint/template/click-events-have-key-events': ['off'],
    },
  },
);

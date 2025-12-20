// Svgo.config.js

import type { Config } from 'svgo';

const fillableElements = ['path', 'rect', 'circle', 'ellipse', 'g'];

const config: Config = {
  multipass: true,
  js2svg: {
    pretty: false,
    indent: 0,
  },
  plugins: [
    {
      name: 'remove-non-fillable',
      fn: () => ({
        element: {
          exit: (node, parentNode): void => {
            if (!fillableElements.includes(node.name) && node.name !== 'svg') {
              parentNode.children = parentNode.children.filter((child) => child !== node);
            }
          },
        },
      }),
    },
    {
      name: 'remove-useless-g',
      fn: () => ({
        element: {
          exit: (node, parentNode): void => {
            if (node.name !== 'g') {
              return;
            }

            const onlyClipPath = Object.keys(node.attributes).every((key) => key === 'clip-path');

            if (Object.keys(node.attributes).length === 0 || onlyClipPath) {
              const index = parentNode.children.indexOf(node);
              parentNode.children.splice(index, 1, ...node.children);
            }
          },
        },
      }),
    },
    {
      name: 'remove-invisible',
      fn: () => ({
        element: {
          exit: (node, parentNode): void => {
            if (!fillableElements.includes(node.name)) {
              return;
            }

            const { fill } = node.attributes;
            const hasFillNone = fill === 'none' || fill === 'transparent';

            if (!hasFillNone) {
              return;
            }

            parentNode.children = parentNode.children.filter((child) => child !== node);
          },
        },
      }),
    },
    {
      name: 'removeAttrs',
      params: {
        attrs: [
          'id',
          'data-name',
          'fill',
          'stroke',
          'stroke-width',
          'stroke-linecap',
          'stroke-linejoin',
          'stroke-miterlimit',
          'clip-rule',
          'class',
          'style',
        ],
      },
    },
    'cleanupAttrs',
    'removeDoctype',
    'removeComments',
    'removeMetadata',
    'removeEmptyAttrs',
    'removeEmptyContainers',
    'removeHiddenElems',
    'removeEmptyText',
    'cleanupNumericValues',
    'collapseGroups',
    'sortAttrs',
    'removeDimensions',
    'removeXMLNS',
    'convertStyleToAttrs',
    {
      name: 'sortAttrs',
      params: {
        order: [
          'xmlns',
          'width',
          'height',
          'viewBox',
          'fill',
          'stroke',
          'stroke-width',
          'stroke-linecap',
          'stroke-linejoin',
          'clip-rule',
          'fill-rule',
          'd',
        ],
      },
    },
    'removeDimensions',
    {
      name: 'addAttributesToSVGElement',
      params: {
        attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
      },
    },
  ],
};

export default config;

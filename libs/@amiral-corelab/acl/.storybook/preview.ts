import type { Preview } from '@storybook/angular';

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const hues = Array.from({ length: 72 }, (_, i) => (i + 1) * 5);

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(?<color>background|color)$/iu,
        date: /Date$/iu,
      },
    },
    docs: {
      canvas: {
        sourceState: 'shown',
      },
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      defaultValue: 'light',
      toolbar: {
        icon: 'contrast',
        items: [
          { value: 'system', title: 'System' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        showName: true,
      },
    },
    hue: {
      name: 'Hue',
      defaultValue: 360,
      toolbar: {
        icon: 'paintbrush',
        // On génère des valeurs de 15 en 15
        items: hues.map((h) => ({ value: h, title: `${h}°` })),
        showName: true,
      },
    },
  },

  decorators: [
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/explicit-function-return-type
    (storyFn, context) => {
      const theme = String(context.globals['theme']);
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      const hue = String(context.globals['hue']).padStart(3, '0');
      const { body } = document;
      body.classList.remove('theme-light', 'theme-dark');
      body.classList.add(`theme-${theme || 'light'}`);
      body.style.setProperty('--color-primary-default', `var(--color-primary-default-${hue})`);
      body.style.setProperty('--color-primary-hover', `var(--color-primary-hover-${hue})`);
      body.style.setProperty('--color-primary-active', `var(--color-primary-active-${hue})`);
      return storyFn();
    },
  ],
};

export default preview;

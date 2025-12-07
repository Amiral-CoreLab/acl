import { toKebabCase, toPascalCase } from '@core';

export const getStoriesFileUtil = (name: string, specNames: string[]): string => {
  const componentName = `${toPascalCase(name)}Component`;
  const kebabName = toKebabCase(name);
  const specStories = specNames
    .map((specName) => `export const Spec${toPascalCase(specName)}: Story = {};`)
    .join('\n\n');

  return `import type { Meta, StoryObj } from '@storybook/angular';
import { ${componentName} } from './${name}.component';

const meta: Meta<${componentName}> = {
  title: 'Components/${kebabName}',
  component: ${componentName},
  tags: ['autodocs'],
  argTypes: {},
  args: {},
  parameters: {},
};

export default meta;

type Story = StoryObj<${componentName}>;

export const Default: Story = {};

${specStories}
`;
};

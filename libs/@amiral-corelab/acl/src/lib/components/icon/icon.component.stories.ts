import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { IconComponent } from './icon.component';
import { iconConstant } from './icon.constant';

const meta: Meta<IconComponent> = {
  title: 'Components/icon',
  component: IconComponent,
  tags: ['autodocs'],
  argTypes: {
    name: {
      type: { name: 'string', required: true },
      control: { type: 'select' },
      options: iconConstant,
      table: {
        category: 'Inputs',
        type: {
          summary: 'Icons',
          detail: iconConstant.map((x) => `"${x}"`).join(' | '),
        },
      },
    },
  },
  args: {
    name: 'brand-acl',
  },
  parameters: {
    docs: {
      description: {
        component: 'Setting `color` in your CSS will change the icon color.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<IconComponent>;

export const Default: Story = {};

export const SpecDefault: Story = {
  parameters: { docs: { disable: true } },
};

export const SpecColorRed: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [IconComponent],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <style>
        acl-icon {
          color: red;
        }
      </style>

      <acl-icon [name]="'brand-acl'" />
    `,
  }),
};

export const SpecSize64px: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [IconComponent],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <style>
        acl-icon {
          width: 64px;
        }
      </style>

      <acl-icon [name]="'brand-acl'" />
    `,
  }),
};

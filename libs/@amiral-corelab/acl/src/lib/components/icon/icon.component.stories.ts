import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { IconComponent } from './icon.component';
import { iconConstant } from './icon.constant';

const meta: Meta<IconComponent> = {
  title: 'Components/icon',
  component: IconComponent,
  argTypes: {
    name: {
      type: { name: 'string', required: true },
      control: { type: 'select' },
      options: iconConstant,
    },
  },
  args: {
    name: 'brand-acl',
  },
};

export default meta;

type Story = StoryObj<IconComponent>;

export const Default: Story = {};

export const SpecDefault: Story = {
  args: {
    name: 'brand-acl',
  },
};

export const SpecColorRed: Story = {
  decorators: [
    moduleMetadata({
      imports: [IconComponent],
    }),
  ],
  args: {
    name: 'brand-acl',
  },
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
  decorators: [
    moduleMetadata({
      imports: [IconComponent],
    }),
  ],
  args: {
    name: 'brand-acl',
  },
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

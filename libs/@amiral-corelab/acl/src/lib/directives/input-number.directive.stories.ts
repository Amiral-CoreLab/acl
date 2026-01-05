import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { InputNumberDirective } from './input-number.directive';

const meta: Meta<InputNumberDirective> = {
  title: 'Directives/input-number',
  component: InputNumberDirective,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    integerOnly: false,
  },
  parameters: {},
};

export default meta;

type Story = StoryObj<InputNumberDirective>;

export const Default: Story = {
  decorators: [
    moduleMetadata({
      imports: [InputNumberDirective],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `<input aclInputNumber type="text" />`,
  }),
};

export const IntegerOnly: Story = {
  decorators: [
    moduleMetadata({
      imports: [InputNumberDirective],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `<input aclInputNumber [integerOnly]="true" type="text" />`,
  }),
};

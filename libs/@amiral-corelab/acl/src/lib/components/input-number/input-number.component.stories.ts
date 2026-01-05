import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { InputNumberComponent } from './input-number.component';

const meta: Meta<InputNumberComponent> = {
  title: 'Components/input-number',
  component: InputNumberComponent,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    name: 'name',
    model: null,
  },
  parameters: {},
};

export default meta;

type Story = StoryObj<InputNumberComponent>;

export const Default: Story = {};

export const SpecActive: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [InputNumberComponent],
    }),
  ],
  args: {
    name: 'name',
    model: null,
  },
  render: (args) => ({
    props: args,
    template: `
      <style>
        acl-input-number {
          translate: 3px 3px;
        }
      </style>

      <acl-input-number [name]="name" [model]="model" />
    `,
  }),
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="text"]');
    input?.focus();
  },
};

export const SpecDefault: Story = {
  parameters: { docs: { disable: true } },
  args: {
    name: 'name',
    model: null,
  },
};

export const SpecHover: Story = {
  parameters: { docs: { disable: true } },
  args: {
    name: 'name',
    model: null,
  },
};

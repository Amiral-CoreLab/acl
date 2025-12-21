import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { InputRadioComponent } from './input-radio.component';

const meta: Meta<InputRadioComponent> = {
  title: 'Components/input-radio',
  component: InputRadioComponent,
  tags: ['autodocs'],
  argTypes: {},
  args: {},
  parameters: {},
};

export default meta;

type Story = StoryObj<InputRadioComponent>;

export const Default: Story = {};

export const SpecDefault: Story = {
  parameters: { docs: { disable: true } },
};

export const SpecDefaultFocus: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [InputRadioComponent],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <style>
        :has(> input) {
          padding: 3px;
        }
      </style>

      <acl-input-radio />
    `,
  }),
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="radio"]');
    input?.focus();
  },
};

export const SpecHover: Story = {
  parameters: { docs: { disable: true } },
};

export const SpecActive: Story = {
  parameters: { docs: { disable: true } },
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="radio"]');
    input?.click();
  },
};

export const SpecActiveFocus: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [InputRadioComponent],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <style>
        :has(> input) {
          padding: 3px;
        }
      </style>

      <acl-input-radio />
    `,
  }),
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="radio"]');
    input?.click();
    input?.focus();
  },
};

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { InputRadioComponent } from './input-radio.component';

const meta: Meta<InputRadioComponent> = {
  title: 'Components/input-radio',
  component: InputRadioComponent,
  tags: ['autodocs'],
  argTypes: {
    name: { control: { type: 'text' } },
    value: { control: { type: 'text' } },
    model: { control: { type: 'text' } },
  },
  args: {
    name: 'name',
    value: 'value',
    model: '',
  },
  parameters: {},
};

export default meta;

type Story = StoryObj<InputRadioComponent>;

export const Default: Story = {};

export const SpecDefault: Story = {
  parameters: { docs: { disable: true } },
  args: {
    name: 'name',
    value: 'value',
    model: '',
  },
};

export const SpecDefaultFocus: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [InputRadioComponent],
    }),
  ],
  args: {
    name: 'name',
    value: 'value',
    model: '',
  },
  render: (args) => ({
    props: args,
    template: `
      <style>
        :has(> input) {
          padding: 3px;
        }
      </style>

      <acl-input-radio [name]="name" [value]="value" [model]="model" />
    `,
  }),
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="radio"]');
    input?.focus();
  },
};

export const SpecHover: Story = {
  parameters: { docs: { disable: true } },
  args: {
    name: 'name',
    value: 'value',
    model: '',
  },
};

export const SpecActive: Story = {
  parameters: { docs: { disable: true } },
  args: {
    name: 'name',
    value: 'value',
    model: 'value',
  },
};

export const SpecActiveFocus: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [InputRadioComponent],
    }),
  ],
  args: {
    name: 'name',
    value: 'value',
    model: 'value',
  },
  render: (args) => ({
    props: args,
    template: `
      <style>
        :has(> input) {
          padding: 3px;
        }
      </style>

      <acl-input-radio [name]="name" [value]="value" [model]="model" />
    `,
  }),
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="radio"]');
    input?.focus();
  },
};

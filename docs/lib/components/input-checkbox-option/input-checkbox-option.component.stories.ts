import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { InputCheckboxOptionComponent } from './input-checkbox-option.component';

const meta: Meta<InputCheckboxOptionComponent> = {
  title: 'Components/input-checkbox-option',
  component: InputCheckboxOptionComponent,
  argTypes: {
    name: {
      type: { name: 'string', required: true },
      control: { type: 'text' },
    },
    value: {
      type: { name: 'string', required: true },
      control: { type: 'text' },
    },
    model: {
      type: { name: 'string', required: true },
      control: { type: 'object' },
    },
  },
  args: {
    name: 'name',
    value: 'value',
    model: ['value'],
  },
  parameters: {},
};

export default meta;

type Story = StoryObj<InputCheckboxOptionComponent>;

export const Default: Story = {};

export const SpecActive: Story = {
  args: {
    name: 'name',
    value: 'test',
    model: ['test'],
  },
};

export const SpecActiveFocus: Story = {
  decorators: [
    moduleMetadata({
      imports: [InputCheckboxOptionComponent],
    }),
  ],
  args: {
    name: 'name',
    value: 'test',
    model: ['test'],
  },
  render: (args) => ({
    props: args,
    template: `
      <style>
        acl-input-checkbox-option {
          translate: 3px 3px;
        }
      </style>

      <acl-input-checkbox-option [name]="name" [value]="value" [model]="model" />
    `,
  }),
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="checkbox"]');
    input?.focus();
  },
};

export const SpecDefault: Story = {
  args: {
    name: 'name',
    value: 'test',
    model: [],
  },
};

export const SpecDefaultFocus: Story = {
  decorators: [
    moduleMetadata({
      imports: [InputCheckboxOptionComponent],
    }),
  ],
  args: {
    name: 'name',
    value: 'test',
    model: [],
  },
  render: (args) => ({
    props: args,
    template: `
      <style>
        acl-input-checkbox-option {
          translate: 3px 3px;
        }
      </style>

      <acl-input-checkbox-option [name]="name" [value]="value" [model]="model" />
    `,
  }),
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="checkbox"]');
    input?.focus();
  },
};

export const SpecHover: Story = {
  args: {
    name: 'name',
    value: 'test',
    model: [],
  },
};

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { InputCheckboxComponent } from './input-checkbox.component';

const meta: Meta<InputCheckboxComponent> = {
  title: 'Components/input-checkbox',
  component: InputCheckboxComponent,
  tags: ['autodocs'],
  argTypes: {
    name: { control: { type: 'text' } },
    indeterminate: { control: { type: 'boolean' } },
    model: { control: { type: 'boolean' } },
  },
  args: {
    name: 'name',
    indeterminate: false,
    model: false,
  },
  parameters: {},
};

export default meta;

type Story = StoryObj<InputCheckboxComponent>;

export const Default: Story = {};

export const SpecActive: Story = {
  parameters: { docs: { disable: true } },
  args: {
    name: 'name',
    model: true,
  },
};

export const SpecActiveFocus: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [InputCheckboxComponent],
    }),
  ],
  args: {
    name: 'name',
    model: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <style>
        :has(> input) {
          padding: 3px;
        }
      </style>

      <acl-input-checkbox [name]="name" [model]="model" [indeterminate]="indeterminate" />
    `,
  }),
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="checkbox"]');
    input?.focus();
  },
};

export const SpecDefault: Story = {
  parameters: { docs: { disable: true } },
  args: {
    name: 'name',
    model: false,
  },
};

export const SpecDefaultFocus: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [InputCheckboxComponent],
    }),
  ],
  args: {
    name: 'name',
    model: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <style>
        :has(> input) {
          padding: 3px;
        }
      </style>

      <acl-input-checkbox [name]="name" [model]="model" [indeterminate]="indeterminate" />
    `,
  }),
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="checkbox"]');
    input?.focus();
  },
};

export const SpecHover: Story = {
  parameters: { docs: { disable: true } },
  args: {
    name: 'name',
    model: false,
  },
};

export const SpecIndeterminate: Story = {
  parameters: { docs: { disable: true } },
  args: {
    name: 'name',
    model: false,
    indeterminate: true,
  },
};

export const SpecIndeterminateFocus: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [InputCheckboxComponent],
    }),
  ],
  args: {
    name: 'name',
    model: false,
    indeterminate: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <style>
        :has(> input) {
          padding: 3px;
        }
      </style>

      <acl-input-checkbox [name]="name" [model]="model" [indeterminate]="indeterminate" />
    `,
  }),
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="checkbox"]');
    input?.focus();
  },
};

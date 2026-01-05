import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { InputCheckboxComponent } from './input-checkbox.component';

const meta: Meta<InputCheckboxComponent> = {
  title: 'Components/input-checkbox',
  component: InputCheckboxComponent,
  argTypes: {
    name: {
      type: { name: 'string', required: true },
      control: { type: 'text' },
    },
    indeterminate: { control: { type: 'boolean' } },
    model: {
      type: { name: 'string', required: true },
      control: { type: 'boolean' },
    },
  },
  args: {
    name: 'name',
    indeterminate: true,
    model: false,
  },
  parameters: {},
};

export default meta;

type Story = StoryObj<InputCheckboxComponent>;

export const Default: Story = {};

export const SpecActive: Story = {
  args: {
    name: 'name',
    indeterminate: false,
    model: true,
  },
};

export const SpecActiveFocus: Story = {
  decorators: [
    moduleMetadata({
      imports: [InputCheckboxComponent],
    }),
  ],
  args: {
    name: 'name',
    indeterminate: false,
    model: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <style>
        acl-input-checkbox {
          translate: 3px 3px;
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
  args: {
    name: 'name',
    indeterminate: false,
    model: false,
  },
};

export const SpecDefaultFocus: Story = {
  decorators: [
    moduleMetadata({
      imports: [InputCheckboxComponent],
    }),
  ],
  args: {
    name: 'name',
    indeterminate: false,
    model: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <style>
        acl-input-checkbox {
          translate: 3px 3px;
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
  args: {
    name: 'name',
    indeterminate: false,
    model: false,
  },
};

export const SpecIndeterminate: Story = {
  args: {
    name: 'name',
    indeterminate: true,
    model: false,
  },
};

export const SpecIndeterminateFocus: Story = {
  decorators: [
    moduleMetadata({
      imports: [InputCheckboxComponent],
    }),
  ],
  args: {
    name: 'name',
    indeterminate: true,
    model: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <style>
        acl-input-checkbox {
          translate: 3px 3px;
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

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { InputTextareaComponent } from './input-textarea.component';

const meta: Meta<InputTextareaComponent> = {
  title: 'Components/input-textarea',
  component: InputTextareaComponent,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    autoResize: true,
    name: 'name',
    model: '',
    minRows: 2,
    maxRows: undefined,
  },
  parameters: {},
};

export default meta;

type Story = StoryObj<InputTextareaComponent>;

export const Default: Story = {};

export const SpecActive: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [InputTextareaComponent],
    }),
  ],
  args: {
    autoResize: false,
    name: 'name',
    model: '',
    minRows: 1,
    maxRows: undefined,
  },
  render: (args) => ({
    props: args,
    template: `
      <style>
        acl-input-textarea {
          translate: 3px 3px;
        }
      </style>

      <acl-input-textarea [autoResize]="autoResize" [name]="name" [model]="model" [minRows]="minRows" [maxRows]="maxRows" />
    `,
  }),
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('textarea');
    input?.focus();
  },
};

export const SpecActive3Lines: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [InputTextareaComponent],
    }),
  ],
  args: {
    autoResize: true,
    name: 'name',
    model: '\n\n',
    minRows: 1,
    maxRows: undefined,
  },
  render: (args) => ({
    props: args,
    template: `
      <style>
        acl-input-textarea {
          translate: 3px 3px;
        }
      </style>

      <acl-input-textarea [autoResize]="autoResize" [name]="name" [model]="model" [minRows]="minRows" [maxRows]="maxRows" />
    `,
  }),
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('textarea');
    input?.focus();
  },
};

export const SpecDefault: Story = {
  parameters: { docs: { disable: true } },
  args: {
    autoResize: false,
    name: 'name',
    model: '',
    minRows: 1,
    maxRows: undefined,
  },
};

export const SpecHover: Story = {
  parameters: { docs: { disable: true } },
  args: {
    autoResize: false,
    name: 'name',
    model: '',
    minRows: 1,
    maxRows: undefined,
  },
};

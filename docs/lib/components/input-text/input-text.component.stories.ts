import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { InputTextComponent } from './input-text.component';

const meta: Meta<InputTextComponent> = {
  title: 'Components/input-text',
  component: InputTextComponent,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    name: 'name',
    model: 'Input Text',
  },
  parameters: {},
};

export default meta;

type Story = StoryObj<InputTextComponent>;

export const Default: Story = {};

export const SpecActive: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [InputTextComponent],
    }),
  ],
  args: {
    name: 'name',
    model: '',
  },
  render: (args) => ({
    props: args,
    template: `
      <style>
        acl-input-text {
          translate: 3px 3px;
        }
      </style>

      <acl-input-text [name]="name" [model]="model" />
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
    model: '',
  },
};

export const SpecHover: Story = {
  parameters: { docs: { disable: true } },
  args: {
    name: 'name',
    model: '',
  },
};

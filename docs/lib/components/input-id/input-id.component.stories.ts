import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { InputIdComponent } from './input-id.component';

const meta: Meta<InputIdComponent> = {
  title: 'Components/input-id',
  component: InputIdComponent,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    name: 'name',
    model: 'Input Text',
  },
  parameters: {},
};

export default meta;

type Story = StoryObj<InputIdComponent>;

export const Default: Story = {};

export const SpecActive: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [InputIdComponent],
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
        acl-input-id {
          translate: 3px 3px;
        }
      </style>

      <acl-input-id [name]="name" [model]="model" />
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

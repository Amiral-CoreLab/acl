import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { InputSwitchComponent } from './input-switch.component';

const meta: Meta<InputSwitchComponent> = {
  title: 'Components/input-switch',
  component: InputSwitchComponent,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    name: 'name',
    model: false,
  },
  parameters: {},
};

export default meta;

type Story = StoryObj<InputSwitchComponent>;

export const Default: Story = {};

export const SpecActive: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [InputSwitchComponent],
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
        acl-input-switch {
          --acl-animation-default: 0ms;

          translate: 3px 3px;
        }
      </style>

      <acl-input-switch [name]="name" [model]="model" />
    `,
  }),
};

export const SpecActiveFocus: Story = {
  parameters: { docs: { disable: true } },
  decorators: [
    moduleMetadata({
      imports: [InputSwitchComponent],
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
        acl-input-switch {
          --acl-animation-default: 0ms;

          translate: 3px 3px;
        }
      </style>

      <acl-input-switch [name]="name" [model]="model" />
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
      imports: [InputSwitchComponent],
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
        acl-input-switch {
          translate: 3px 3px;
        }
      </style>

      <acl-input-switch [name]="name" [model]="model" />
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

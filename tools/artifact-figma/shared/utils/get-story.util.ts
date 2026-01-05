import { toPascalCase } from '@core';

export const getStoryUtil = (name: string): string => `export const Spec${toPascalCase(name)}: Story = {};`;

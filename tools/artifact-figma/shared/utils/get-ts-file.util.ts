import { toKebabCase, toPascalCase } from '@core';

export const getTsFileUtil = (name: string): string => {
  const componentName = `${toPascalCase(name)}Component`;
  const kebabName = toKebabCase(name);

  return `import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'acl-${kebabName}',
  imports: [],
  templateUrl: './${kebabName}.component.html',
  styleUrl: './${kebabName}.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ${componentName} {}
`;
};

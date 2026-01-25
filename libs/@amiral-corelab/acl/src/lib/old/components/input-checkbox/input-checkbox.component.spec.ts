import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { InputCheckboxComponent } from './input-checkbox.component';
import { beforeEach, describe, expect, it } from 'vitest';

describe('InputRadioComponent', () => {
  let component: InputCheckboxComponent;
  let fixture: ComponentFixture<InputCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputCheckboxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputCheckboxComponent);
    fixture.componentRef.setInput('name', 'name');
    fixture.componentRef.setInput('indeterminate', false);
    fixture.componentRef.setInput('model', false);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

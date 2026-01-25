import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { InputCheckboxOptionComponent } from './input-checkbox-option.component';
import { beforeEach, describe, expect, it } from 'vitest';

describe('InputCheckboxOptionComponent', () => {
  let component: InputCheckboxOptionComponent;
  let fixture: ComponentFixture<InputCheckboxOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputCheckboxOptionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputCheckboxOptionComponent);
    fixture.componentRef.setInput('name', 'name');
    fixture.componentRef.setInput('value', 'value');
    fixture.componentRef.setInput('model', []);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

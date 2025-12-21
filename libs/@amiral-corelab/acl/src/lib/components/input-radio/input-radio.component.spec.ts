import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { InputRadioComponent } from './input-radio.component';
import { beforeEach, describe, expect, it } from 'vitest';

describe('InputRadioComponent', () => {
  let component: InputRadioComponent;
  let fixture: ComponentFixture<InputRadioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputRadioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputRadioComponent);
    fixture.componentRef.setInput('name', 'name');
    fixture.componentRef.setInput('value', 'value');
    fixture.componentRef.setInput('model', '');
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

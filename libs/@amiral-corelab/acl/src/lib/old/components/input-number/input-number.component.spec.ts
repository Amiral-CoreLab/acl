import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { InputNumberComponent } from './input-number.component';
import { beforeEach, describe, expect, it } from 'vitest';

describe('InputRadioComponent', () => {
  let component: InputNumberComponent;
  let fixture: ComponentFixture<InputNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputNumberComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputNumberComponent);
    fixture.componentRef.setInput('name', 'name');
    fixture.componentRef.setInput('model', '');
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

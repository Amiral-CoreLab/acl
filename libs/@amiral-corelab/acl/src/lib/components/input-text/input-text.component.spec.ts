import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { InputTextComponent } from './input-text.component';
import { beforeEach, describe, expect, it } from 'vitest';

describe('InputTextComponent', () => {
  let component: InputTextComponent;
  let fixture: ComponentFixture<InputTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputTextComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputTextComponent);
    fixture.componentRef.setInput('name', 'name');
    fixture.componentRef.setInput('model', '');
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Shift } from './shift';

describe('Shift', () => {
  let component: Shift;
  let fixture: ComponentFixture<Shift>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shift]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Shift);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficialLeaveList } from './official-leave-list';

describe('OfficialLeaveList', () => {
  let component: OfficialLeaveList;
  let fixture: ComponentFixture<OfficialLeaveList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficialLeaveList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficialLeaveList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

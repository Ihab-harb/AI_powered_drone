import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripsDialogComponent } from './trips-dialog.component';

describe('TripsDialogComponent', () => {
  let component: TripsDialogComponent;
  let fixture: ComponentFixture<TripsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

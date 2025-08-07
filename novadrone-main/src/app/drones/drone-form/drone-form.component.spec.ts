import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DroneFormComponent } from './drone-form.component';

describe('DroneFormComponent', () => {
  let component: DroneFormComponent;
  let fixture: ComponentFixture<DroneFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DroneFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DroneFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

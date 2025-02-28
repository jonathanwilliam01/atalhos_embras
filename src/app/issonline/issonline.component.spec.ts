import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssonlineComponent } from './issonline.component';

describe('IssonlineComponent', () => {
  let component: IssonlineComponent;
  let fixture: ComponentFixture<IssonlineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssonlineComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IssonlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GccComponent } from './gcc.component';

describe('GccComponent', () => {
  let component: GccComponent;
  let fixture: ComponentFixture<GccComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GccComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GccComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

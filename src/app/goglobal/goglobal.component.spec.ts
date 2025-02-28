import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoglobalComponent } from './goglobal.component';

describe('GoglobalComponent', () => {
  let component: GoglobalComponent;
  let fixture: ComponentFixture<GoglobalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoglobalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GoglobalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

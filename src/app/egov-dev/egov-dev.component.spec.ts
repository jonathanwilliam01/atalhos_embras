import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EgovDevComponent } from './egov-dev.component';

describe('EgovDevComponent', () => {
  let component: EgovDevComponent;
  let fixture: ComponentFixture<EgovDevComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EgovDevComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EgovDevComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

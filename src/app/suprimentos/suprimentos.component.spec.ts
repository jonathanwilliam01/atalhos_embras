import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuprimentosComponent } from './suprimentos.component';

describe('SuprimentosComponent', () => {
  let component: SuprimentosComponent;
  let fixture: ComponentFixture<SuprimentosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuprimentosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SuprimentosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

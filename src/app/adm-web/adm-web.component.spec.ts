import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmWebComponent } from './adm-web.component';

describe('AdmWebComponent', () => {
  let component: AdmWebComponent;
  let fixture: ComponentFixture<AdmWebComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmWebComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdmWebComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

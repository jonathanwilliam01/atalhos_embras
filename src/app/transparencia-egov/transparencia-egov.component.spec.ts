import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransparenciaEgovComponent } from './transparencia-egov.component';

describe('TransparenciaEgovComponent', () => {
  let component: TransparenciaEgovComponent;
  let fixture: ComponentFixture<TransparenciaEgovComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransparenciaEgovComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TransparenciaEgovComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

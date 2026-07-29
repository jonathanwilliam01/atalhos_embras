import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovoTransparenciaComponent } from './novo-transparencia.component';

describe('NovoTransparenciaComponent', () => {
  let component: NovoTransparenciaComponent;
  let fixture: ComponentFixture<NovoTransparenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovoTransparenciaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NovoTransparenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

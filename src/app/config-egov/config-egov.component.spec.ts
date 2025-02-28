import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigEgovComponent } from './config-egov.component';

describe('ConfigEgovComponent', () => {
  let component: ConfigEgovComponent;
  let fixture: ComponentFixture<ConfigEgovComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigEgovComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfigEgovComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

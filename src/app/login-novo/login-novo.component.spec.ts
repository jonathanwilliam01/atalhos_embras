import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginNovoComponent } from './login-novo.component';

describe('LoginNovoComponent', () => {
  let component: LoginNovoComponent;
  let fixture: ComponentFixture<LoginNovoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginNovoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginNovoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

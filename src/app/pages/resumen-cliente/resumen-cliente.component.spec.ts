import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumenClienteComponent } from './resumen-cliente.component';

describe('ResumenClienteComponent', () => {
  let component: ResumenClienteComponent;
  let fixture: ComponentFixture<ResumenClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenClienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumenClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

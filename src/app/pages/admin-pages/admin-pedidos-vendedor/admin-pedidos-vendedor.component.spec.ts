import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPedidosVendedorComponent } from './admin-pedidos-vendedor.component';

describe('AdminPedidosVendedorComponent', () => {
  let component: AdminPedidosVendedorComponent;
  let fixture: ComponentFixture<AdminPedidosVendedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPedidosVendedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPedidosVendedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

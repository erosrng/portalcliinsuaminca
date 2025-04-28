import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadPedidosComponent } from './upload-pedidos.component';

describe('UploadPedidosComponent', () => {
  let component: UploadPedidosComponent;
  let fixture: ComponentFixture<UploadPedidosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadPedidosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadPedidosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

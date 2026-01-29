import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetencionesPageComponent } from './retenciones-page.component';

describe('RetencionesPageComponent', () => {
  let component: RetencionesPageComponent;
  let fixture: ComponentFixture<RetencionesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RetencionesPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RetencionesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

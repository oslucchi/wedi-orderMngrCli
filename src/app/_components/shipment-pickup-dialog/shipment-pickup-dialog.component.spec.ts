import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmentPickupDialogComponent } from './shipment-pickup-dialog.component';

describe('ShipmentDialogComponent', () => {
  let component: ShipmentPickupDialogComponent;
  let fixture: ComponentFixture<ShipmentPickupDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShipmentPickupDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShipmentPickupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderStatusChangeEmailComponent } from './order-status-change-email.component';

describe('OrderStatusChangeEmailComponent', () => {
  let component: OrderStatusChangeEmailComponent;
  let fixture: ComponentFixture<OrderStatusChangeEmailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrderStatusChangeEmailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderStatusChangeEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

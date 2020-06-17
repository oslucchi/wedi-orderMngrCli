import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderHandlerComponent } from './order-handler.component';

describe('OrderHandlerComponent', () => {
  let component: OrderHandlerComponent;
  let fixture: ComponentFixture<OrderHandlerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrderHandlerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderHandlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

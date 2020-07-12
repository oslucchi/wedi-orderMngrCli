import { Orders } from './orders';
import { OrderNotes } from './order-notes';
import { StatusItem } from '@app/_models/status-item';
import { OrderShipments } from './order-shipments';
import { CustomerDelivery } from './customer-delivery';
import { Customers } from './customers';

export class OrderHandler {
  public status: StatusItem[] = [
    {id: "SYS", des: "Inserito a sistema", selected: false, disabled: true},
    {id: "CON", des: "Confermato", selected: false, disabled: true},
    {id: "COE", des: "Confermato con eccezione", selected: false, disabled: true},
    {id: "PRE", des: "In preparazione", selected: false, disabled: true},
    {id: "RDY", des: "Pronto", selected: false, disabled: true},
    {id: "SHI", des: "Spedito", selected: false, disabled: true}
  ];

  public details: Orders = new Orders;
  public note: OrderNotes = new OrderNotes;
  public shipments: OrderShipments[] = new Array();
  public customerDelivery: CustomerDelivery = new CustomerDelivery;
  public statusPre: string;
  public customer: Customers = new Customers();
}
import { Orders } from './orders';
import { OrderNotes } from './order-notes';
import { StatusItem } from '@app/_models/status-item';
import { OrderShipments } from './order-shipments';

export class OrderHandler {
  public status: StatusItem[] = [
    {id: "SYS", des: "Inserito a sistema", selected: false},
    {id: "ONH", des: "Sospeso", selected: false},
    {id: "CON", des: "Confermato", selected: false},
    {id: "COE", des: "Confermato con eccezione", selected: false},
    {id: "PRE", des: "In preparazione", selected: false},
    {id: "RDY", des: "Pronto", selected: false},
    {id: "SHI", des: "Spedito", selected: false}
  ];

  public details: Orders = new Orders;
  public note: OrderNotes = new OrderNotes;
  public shipments: OrderShipments = new OrderShipments;
}
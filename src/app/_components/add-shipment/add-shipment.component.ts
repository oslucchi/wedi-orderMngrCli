import { Component, OnInit, Inject } from '@angular/core';
import { Shipment } from '@app/_models/shipment';
import { ApiService } from '@app/_services/api.service';
import { MatDialogRef, MAT_DIALOG_DATA, MatTableDataSource } from '@angular/material';
import { OrderShipments } from '@app/_models/order-shipments';
import { Orders } from '@app/_models/orders';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-add-shipment',
  templateUrl: './add-shipment.component.html',
  styleUrls: ['./add-shipment.component.css']
})

export class AddShipmentComponent implements OnInit {
  public shipment = new OrderShipments;
  public dataSourceShipments: MatTableDataSource<OrderShipments>;
  public order: Orders;
  public caption: string;
  public shipments: OrderShipments[];

  private service: ApiService;  

  private shipmentsDisplayedColumns: any[] = [
    { def: 'palletLength', hide: false }, 
    { def: 'palletWidth', hide: false }, 
    { def: 'palletHeigth', hide: false },  
    { def: 'palletWeigth', hide: false },
    { def: 'forwarderCost', hide: false },
    { def: 'clientCost', hide: false },
    { def: 'note', hide: false }
  ];

  constructor(private dialogRef: MatDialogRef<AddShipmentComponent>,
              private apiService: ApiService,
              @Inject(MAT_DIALOG_DATA) data) 
  {
    this.apiService = apiService;
    this.caption = data.caption;
    this.order = data.order;
  }

  ngOnInit() 
  {
    this.shipment.idOrderShipment = 0;

    this.apiService
      .get(
        "orders/shipments/" + this.order.idOrder
      )
      .subscribe(
        (res: HttpResponse<any>)=>{  
          console.log(res);
          this.shipments = res.body.orderShipments;
          this.dataSourceShipments = new MatTableDataSource<OrderShipments>(this.shipments);
        }
      );
  }

  getShipmentDisplayedColumns():string[]
  {
    var a: string[] = this.shipmentsDisplayedColumns.filter(cd => !cd.hide).map(cd => cd.def);
    return a;
  }

  newShipment()
  {
    this.shipment = new OrderShipments;
    this.shipment.note = "";
  }

  saveShipment()
  {
    if (this.shipment.idOrderShipment != 0)
    {
      this.apiService
        .update(
          "orders/shipment",
          {
            "shipment" : this.shipment
          }
        )
        .subscribe((res: HttpResponse<any>)=>{ 
          console.log("Shipment " + this.shipment.idOrderShipment + " changed");
          this.shipment = new OrderShipments();
        });
    }
    else
    {
      const shipmentsTemp = this.dataSourceShipments.data; 
      this.shipment.idOrder = this.order.idOrder;
      this.shipment.numberOfItemsToShip = 1;
      this.apiService
        .post(
          "orders/addShipment",
          {
            "shipment" : this.shipment
          }
        )
        .subscribe((res: HttpResponse<any>)=>{ 
          console.log("Shipment " + this.shipment.idOrderShipment + " added");
          this.shipment = res.body.shipment;
          shipmentsTemp.push(this.shipment);
          this.dataSourceShipments.data = shipmentsTemp;
          this.shipment = new OrderShipments();
        });
      }
  }

  editShipment(shipment)
  {
    this.shipment = shipment;
  }

  calculateShipmentCosts()
  {
    if ((this.shipment.palletLength == 0) ||
        (this.shipment.palletHeigth == 0) ||
        (this.shipment.palletWidth == 0) ||
        (this.shipment.palletWeigth == 0) ||
        (this.shipment.palletLength == null) ||
        (this.shipment.palletHeigth == null) ||
        (this.shipment.palletWidth == null) ||
        (this.shipment.palletWeigth == null))
    {
      return;
    }

    switch(this.order.forwarder)
    {
      case "CES":
        break;
      case "TWS":
      case "CLI":
        return; 
    }

    this.apiService
    .post(
      "orders/shipmentCost",
      {
        "forwarder" : this.order.forwarder, 
        "province" : this.order.customerDeliveryProvince,
        "len" : this.shipment.palletLength,
        "width" : this.shipment.palletWidth,
        "height" : this.shipment.palletHeigth,
        "weight" : this.shipment.palletWeigth
      }
    )
    .subscribe(
      (res: HttpResponse<any>)=>{  
        console.log(res);
        this.shipment.forwarderCost = res.body.shipmentCost;
      }
    );
  }

}
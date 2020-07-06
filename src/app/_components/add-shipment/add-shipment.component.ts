import { Component, OnInit, Inject, Output } from '@angular/core';
import { Shipment } from '@app/_models/shipment';
import { ApiService } from '@app/_services/api.service';
import { MatDialogRef, MAT_DIALOG_DATA, MatTableDataSource } from '@angular/material';
import { OrderShipments } from '@app/_models/order-shipments';
import { Orders } from '@app/_models/orders';
import { HttpResponse } from '@angular/common/http';
import { EventEmitter } from '@angular/core';

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
  public shipCosts: number[] = [0, 0];

  private apiService: ApiService;  
  private dialogRef: MatDialogRef<AddShipmentComponent>;

  private shipmentsDisplayedColumns: any[] = [
    { def: 'palletLength', hide: false }, 
    { def: 'palletWidth', hide: false }, 
    { def: 'palletHeigth', hide: false },  
    { def: 'palletWeigth', hide: false },
    { def: 'forwarderCost', hide: false },
    { def: 'clientCost', hide: false },
    { def: 'note', hide: false }
  ];

  public onClose = new EventEmitter();


  constructor(private dialog: MatDialogRef<AddShipmentComponent>,
              private service: ApiService,
              @Inject(MAT_DIALOG_DATA) data) 
  {
    this.dialogRef = dialog;
    this.apiService = service;
    this.caption = data.caption;
    this.order = data.order;
    this.shipments = data.shipments;
    this.dataSourceShipments = new MatTableDataSource<OrderShipments>(this.shipments);

    this.dialogRef.backdropClick().subscribe(() => { this.closeForm(); });
    this.shipment.idOrder = data.order.idOrder;
  }

  ngOnInit() 
  {
  }

  getShipmentDisplayedColumns():string[]
  {
    var a: string[] = this.shipmentsDisplayedColumns.filter(cd => !cd.hide).map(cd => cd.def);
    return a;
  }

  newShipment()
  {
    this.shipment = new OrderShipments;
    this.shipment.idOrder = this.order.idOrder;
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

  shipmentCostCalculate(shipments: OrderShipments[])
  {
    shipments.forEach(element => {
      this.shipCosts[0] += element.forwarderCost  
      this.shipCosts[1] += element.clientCost  
    });
  }

  closeForm()
  {
    this.shipmentCostCalculate(this.shipments);
    
    this.onClose.emit();
    this.dialogRef.close();
  }
}
import { Component, OnInit, Input, Output } from '@angular/core';
import { Orders } from "@app/_models/orders";
import { ApiService } from '@app/_services/api.service';
import { OrderHandler } from '@app/_models/order-handler';
import { OrderDetails } from '@app/_models/order-details';
import { MatSelectChange, NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS, MatTableDataSource, MAT_DATE_LOCALE } from '@angular/material';
import { HttpResponse } from '@angular/common/http';
import { UserProfileConstants, UserProfile } from '@app/_models/user-profile';
import { EventEmitter } from '@angular/core';
import { StatusItem } from '@app/_models/status-item';
import { ListItem } from '@app/_models/list-item';
import { formatDate } from '@angular/common';
import { MatDialog, MatDialogConfig } from "@angular/material";
import { ShipmentPickupDialogComponent } from '@app/_components/shipment-pickup-dialog/shipment-pickup-dialog.component';
import { AddShipmentComponent } from '../add-shipment/add-shipment.component';
import { OrderShipments } from '@app/_models/order-shipments';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import * as moment from "moment";
import { OrderStatusChangeEmailComponent } from '../order-status-change-email/order-status-change-email.component';

export const MY_FORMATS = {
  parse: {
      dateInput: 'DD/MM/YYYY',
  },
  display: {
      dateInput: 'DD/MM/YYYY',
      monthYearLabel: 'MM YYYY',
      dateA11yLabel: 'DD/MM/YYYY',
      monthYearA11yLabel: 'MM YYYY',
  },
};

@Component({
  selector: 'app-order-handler',
  templateUrl: './order-handler.component.html',
  styleUrls: ['./order-handler.component.css'],
  providers: [{
        provide: MAT_DATE_LOCALE,
        useValue: 'it'
      },
      {
        provide: MAT_DATE_FORMATS,
        useValue: MY_FORMATS
      }]
})

export class OrderHandlerComponent implements OnInit {
  @Input() orderHandler: OrderHandler;
  @Input() orderList: Orders[];
  @Input() orderDetails: OrderDetails[];
  @Input() profile: UserProfile;
  @Input() orderValue: number;
  @Input() status: StatusItem[];

  @Output("getOrdersBasedOnFilters") getOrdersBasedOnFilters: EventEmitter<any> = new EventEmitter();
  @Output("resetOrderStatus") resetOrderStatus: EventEmitter<any> = new EventEmitter();
  
  private service: ApiService;
  
  public forwarder: ListItem[] = [
    { id: "CES", des: "CESPED", selected: false },
    { id: "TWS", des: "TWS - Collettame", selected: false },
    { id: "CLI", des: "Ritiro cliente", selected: false },
    { id: "GLS", des: "GLS - Collettame", selected: false },
    { id: "DIR", des: "Consegna diretta", selected: false }
  ]

  constructor(private apiService: ApiService,
              private dialog: MatDialog) {
    this.service = apiService;
  }

  ngOnInit()
  {
  }

  printLabels() {
    var i: number;
    var copies: number;
    var notes: string;
    var shipTo: string;
    var numberOfItemsToShip: number;

    notes = this.orderHandler.customerDelivery.notes;
    shipTo = this.orderHandler.details.customerDescription + 
             ((notes != null) && (notes != "") ? "\n" + notes : "");

    switch(this.orderHandler.details.forwarder)
    {
      case "CES":
        copies = 2;
        numberOfItemsToShip = this.orderHandler.shipments.length;
        break;
      default:
        copies = 1;
        numberOfItemsToShip = this.orderHandler.shipments[0].numberOfItemsToShip;
        break;
    }

    console.log("Priting labels: " + 
                "shipTo: " + shipTo +
                " - address: " + this.orderHandler.customerDelivery.address +
                " - zipCityProvince:" + this.orderHandler.customerDelivery.zipCode + " " +
                                     this.orderHandler.customerDelivery.city + " " +
                                     this.orderHandler.customerDelivery.province +
                " - forwarder: " + this.orderHandler.details.forwarder +
                " - orderRefERP" + this.orderHandler.details.orderRef.substring(2) +
                " - numberOfItems" + numberOfItemsToShip +
                " - copies: " + copies);

    this.service
    .post(
      'utils/printLabel',
      {
        "shipTo" : shipTo,
        "address" : this.orderHandler.customerDelivery.address,
        "zipCityProvince" : this.orderHandler.customerDelivery.zipCode + " " +
                            this.orderHandler.customerDelivery.city + " " +
                            this.orderHandler.customerDelivery.province,
        "forwarder" : this.orderHandler.details.forwarder,
        "orderRefERP" : this.orderHandler.details.orderRef.substring(2),
        "numberOfItems" : numberOfItemsToShip,
        "copies" : copies
        }
    )
    .subscribe(
      (res: HttpResponse<any>)=>{  
        console.log(res);
      }
    );
  }

  mailPickup() {
    this.service
    .post(
      'utils/createShipments',
      {
        'forwarder' : "CES"
      }
    )
    .subscribe(
      (res: HttpResponse<any>)=>{  
        console.log(res);
        const dialogConfig = new MatDialogConfig();

        dialogConfig.disableClose = false;
        dialogConfig.autoFocus = true;
        dialogConfig.hasBackdrop = true;
    
        dialogConfig.data = {
          id: 1,
          title: 'Gestione richiesta di pick a vettore',
          message: 'funziona?',
          shipmentList: res.body.shipmentList,
          forwarder: "CES"
        };

        dialogConfig.height = '800px';
        dialogConfig.width = '1600px';
    
        this.dialog.open(ShipmentPickupDialogComponent, dialogConfig);
      }
    );
  }

  addShipment()
  {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.hasBackdrop = true;

    dialogConfig.data = {
      id: 1,
      caption: 'Aggiunta spedizione a ordine',
      order: this.orderHandler.details,
      shipments: this.orderHandler.shipments
    };
    
    dialogConfig.height = '600px';
    dialogConfig.width = '1000px';

    let dialogRef = this.dialog.open(AddShipmentComponent, dialogConfig);
    const sub = dialogRef.componentInstance.onClose.subscribe(() => {
      console.log("onClose event emitted");
      this.orderHandler.details.forwarderCost = dialogRef.componentInstance.shipCosts[0];
      this.orderHandler.details.clientCost = dialogRef.componentInstance.shipCosts[1];
      });
    dialogRef.afterClosed().subscribe(() => {
      // unsubscribe onAdd
    });
  }
  
  onOrderStatusChange(event:MatSelectChange)
  {
    var i: number;
    var y: number;
    var reject: boolean;
    var rejectMsg: string;

    rejectMsg = "";
    if ((event.source.value == "CON") || (event.source.value == "COE"))
    {
      if ((this.orderHandler.details.forwarder == null) || 
          (this.orderHandler.details.forwarder == ""))
      {
        rejectMsg = "E' necessario specificare il trasportatore";
      }
    }
    else if (event.source.value == "RDY")
    {
      if ((this.orderHandler.details.transportDocNum == null) || 
          (this.orderHandler.details.transportDocNum == ""))
      {
        rejectMsg = "Il campo DDT deve essere popolato";
      }

      if ((this.orderHandler.details.forwarder == "CES") && 
          ((this.orderHandler.shipments[0].palletLength == 0) ||
           (this.orderHandler.shipments[0].palletWidth == 0) ||
           (this.orderHandler.shipments[0].palletHeigth == 0) ||
           (this.orderHandler.shipments[0].palletWeigth == 0) ||
           (this.orderHandler.details.forwarderCost == 0) ||
           (this.orderHandler.details.customerDeliveryProvince == null) ||
           (this.orderHandler.details.customerDeliveryProvince == "")))
      {
        rejectMsg = "I dati della spedizione devono essere popolati";
      }
      if ((this.orderHandler.details.forwarder == "TWS") && 
          ((this.orderHandler.shipments[0].numberOfItemsToShip == 0) ||
          (this.orderHandler.details.customerDeliveryProvince == null) ||
           (this.orderHandler.details.customerDeliveryProvince == "")))
      {
        rejectMsg = "Bisonga specificare il numero di colli spediti";
      }
    }

    if (rejectMsg != "")
    {
      window.alert(rejectMsg +  " perche' l'ordine possa essere cambiato di stato");
      this.orderHandler.details.status = this.orderHandler.statusPre;
      event.source.writeValue(this.orderHandler.statusPre);
      return;
    }

    for(i = 0; i < this.orderList.length; i++)
    {
      if (this.orderList[i].idOrder == this.orderHandler.details.idOrder)
      {
        this.orderList[i].status = event.source.value;
        switch(event.source.value)
        {
        case "SHI":
          this.orderList[i].shipmentDate = new Date();
          break;
        }
        break;
      }
    }
    this.resetOrderStatus.emit({event: event.source.value});
    this.orderHandler.statusPre = event.source.value;

    console.log(this.orderHandler.details);

    this.service
      .update(
        'orders/update/' + this.orderHandler.details.idOrder,
        {
          "order": this.orderHandler.details,
        }
      )
      .subscribe(
          (res: HttpResponse<any>)=>{  
            console.log(res);
            switch(event.source.value)
            {
              case "SYS":
                if (!this.profile.filters.filterOrders[UserProfileConstants.FILTER_ORDER_INSERTED])
                  this.getOrdersBasedOnFilters.emit();
                break;
              case "CON":
                this.sendStatusChangeConfirmationEmail();
                if (!this.profile.filters.filterOrders[UserProfileConstants.FILTER_ORDER_CONFIRMED])
                  this.getOrdersBasedOnFilters.emit();          
                  break;
              case "COE":
                if (!this.profile.filters.filterOrders[UserProfileConstants.FILTER_ORDER_CONFIRMED_WITH_EXCEPTION])
                  this.getOrdersBasedOnFilters.emit();
                break;  
              case "ONH":
                if (!this.profile.filters.filterOrders[UserProfileConstants.FILTER_ORDER_ONHOLD])
                  this.getOrdersBasedOnFilters.emit();
                break;
              case "PRE":
                this.orderUpdatePackagingStatistics("autoStart", 0);
                if (!this.profile.filters.filterWarehouse[UserProfileConstants.FILTER_WAREHOUSE_IN_PREPARATION])
                  this.getOrdersBasedOnFilters.emit();
                break;
              case "RDY":
                this.orderUpdatePackagingStatistics("autoEnd", 0);
                this.sendStatusChangeConfirmationEmail();
                if (!this.profile.filters.filterWarehouse[UserProfileConstants.FILTER_WHAREHOUSE_READY])
                    this.getOrdersBasedOnFilters.emit();
                break;
              case "SHI":
                if (!this.profile.filters.filterShipment[UserProfileConstants.FILTER_SHIPMENT_COMPLETED])
                  this.getOrdersBasedOnFilters.emit();
                break;
              case "INV":
                if (!this.profile.filters.filterInvoice[UserProfileConstants.FILTER_INVOICE_COMPLETED])
                  this.getOrdersBasedOnFilters.emit();
                break;
              }
         }
      );

  }

  sendStatusChangeConfirmationEmail()
  {
    console.log("Sending status email change to customer");
    this.service
      .post(
        "utils/statusEmail",
        {
          "order" : this.orderHandler.details,
          "customer" : this.orderHandler.customer,
          "customerDelivery" : this.orderHandler.customerDelivery
        }
      )
      .subscribe(
          (res: HttpResponse<any>)=>{
            console.log(res);
            var alertMsg: string = res.body.resource;
            if ((res.status == 200) && (alertMsg != null))
            {
              window.alert(alertMsg);
            }
          }
      );
  }

  orderUpdatePackagingStatistics(what: string, value: number)
  {
    this.service
      .update(
        'statistics/packaging',
        {
          "attributes": {
            "idOrder": this.orderHandler.details.idOrder,
            "what": what,
            "value": value
          }
        }
      )
      .subscribe(
        (res: HttpResponse<any>)=>{  
          console.log(res.body.pkgStats);
          if ((res.body.pkgStats.autoEndTime != null) &&
              (res.body.pkgStats.autoEndTime != 0) &&
              (res.body.pkgStats.autoStartTime != null) &&
              (res.body.pkgStats.autoStartTime != 0))
          {
            var elapsed: number;
            elapsed = (res.body.pkgStats.autoEndTime - res.body.pkgStats.autoStartTime) / 60000;
            this.orderHandler.details.assemblyTimeAuto = Math.floor(elapsed);
          }
          else if (res.body.pkgStats.manualTime > 0)
          {
            this.orderHandler.details.assemblyTime = res.body.pkgStats.manualTime;
          }
          else
          {
            this.orderHandler.details.assemblyTime = 0;
          }
          this.service
            .update(
              'orders/update/' + this.orderHandler.details.idOrder,
              {
                "order": this.orderHandler.details,
              }
            )
            .subscribe(
              (res: HttpResponse<any>)=>{  
                console.log(res);
              }
            );
        }
      );
  }
  
  onOrderNoteChange(event:any)
  {
    console.log(this.orderHandler.note);
    if (this.orderHandler.note.idOrder == 0)
    {
      this.orderHandler.note.idOrder =  this.orderHandler.details.idOrder;
    }
    this.service
      .update(
        'orders/notes/update/' + this.orderHandler.details.idOrder,
        {
          "orderNote": this.orderHandler.note
        }
      )
      .subscribe(
          (res: HttpResponse<any>)=>{  
            console.log(res);
             this.orderHandler.note = res.body.orderNotes;
      });
  }
 
  onDeliveryAttributeChange(event:any)
  {
    var sourceId: string;
    var province: string;

    console.log(event);
    if (event.source != null)
    {
      sourceId = event.source._id;
    }
    else if (event.srcElement != null)
    {
      sourceId = event.srcElement.id;
      province = event.srcElement.value;
    }
    console.log(sourceId + " changed ");
    if ((sourceId == "province") && this.orderHandler.details.forwarder != "CLI")
    {
      this.service
      .post(
        "orders/shipmentCost",
        {
          "forwarder" : this.orderHandler.details.forwarder, 
          "province" : province,
          "len" : this.orderHandler.shipments[0].palletLength,
          "width" : this.orderHandler.shipments[0].palletWidth,
          "height" : this.orderHandler.shipments[0].palletHeigth,
          "weight" : this.orderHandler.shipments[0].palletWeigth
        }
      )
      .subscribe(
        (res: HttpResponse<any>)=>{  
          console.log(res);
          this.orderHandler.details.forwarderCost = res.body.shipmentCost;
          this.orderHandler.shipments[0].forwarderCost = res.body.shipmentCost;
        }
      );
    }

    this.service
      .get(
        "deliveries/order/" + this.orderHandler.details.idOrder
      )
      .subscribe(
        (res: HttpResponse<any>)=>{  
          console.log(res);
          if ((res.body.customerDelivery.province == null) ||
              (this.orderHandler.customerDelivery.province.trim().toUpperCase() != res.body.customerDelivery.province.trim().toUpperCase()))
          {
            this.orderHandler.customerDelivery.province = this.orderHandler.customerDelivery.province.trim().toUpperCase()
            this.service
              .update(
                "deliveries/update",
                {
                  "customerDelivery" : this.orderHandler.customerDelivery
                }
              )
              .subscribe(
                (res: HttpResponse<any>)=>{
                  this.orderHandler.details.customerDeliveryProvince = this.orderHandler.customerDelivery.province; 
                  this.updateOrder();
                  console.log(res);
                }
              );
          }
        }
      );
  }

  isLogisticMailConfigured()
  {
    if ((this.orderHandler.customerDelivery.logisticCommEmail != null) &&
        (this.orderHandler.customerDelivery.logisticCommEmail != ""))
      return true;
    else
      return false;
  }

  onAttributeChange(event:any)
  {
    var sourceId: string;
    var value: any;

    console.log("onAttributeChange() called");
    if (event == null)
    {
      console.log("Event is null, doing nothing");
      return;
    }
    if (event.source != null)
    {
      sourceId = event.source._id;
      value = (sourceId.localeCompare("requestedAssemblyDate") == 0 ? event.source.value._d : event.source.value);
    }
    else if (event.srcElement != null)
    {
      sourceId = event.srcElement.id;
      value = event.srcElement.value;
    }
    console.log(sourceId + " changed to: '" + value + "'");

    switch(sourceId)
    {
      case "palletLength":
        this.orderHandler.shipments[0].palletLength = parseInt(value);
        break;
      
      case "palletWidth":
        this.orderHandler.shipments[0].palletWidth = parseInt(value);
        break;
      
      case "palletHeigth":
        this.orderHandler.shipments[0].palletHeigth = parseInt(value);
        break;
      
      case "palletWeigth":
        this.orderHandler.shipments[0].palletWeigth = parseInt(value);
        break;

      case "numberOfItemsToShip":
        this.orderHandler.shipments[0].numberOfItemsToShip = parseInt(value);
        break;

      case "forwarder":
        if ((value == "CLI") && !this.isLogisticMailConfigured())
        {
          const dialogConfig = new MatDialogConfig();

          dialogConfig.disableClose = false;
          dialogConfig.autoFocus = true;
          dialogConfig.hasBackdrop = true;
      
          dialogConfig.data = {
            id: 1,
            caption: 'Mail variazioni ordine',
            customer: this.orderHandler.customer,
            customerDelivery: this.orderHandler.customerDelivery
          };
          
          dialogConfig.height = '400px';
          dialogConfig.width = '600px';
      
          let dialogRef = this.dialog.open(OrderStatusChangeEmailComponent, dialogConfig);
          const sub = dialogRef.componentInstance.onClose.subscribe(() => {
            console.log("onClose event emitted");
            });
          dialogRef.afterClosed().subscribe(() => {
            // unsubscribe onAdd
          });
      
        }
        this.orderHandler.details.forwarder = value;
        break;

      case "requestedAssemblyDate":
        this.orderHandler.details.requestedAssemblyDate = new Date(value);
        break;

      case "orderValue":
        this.orderHandler.details.orderValue = value;
        break;

      case "assemblyTime":
        this.orderUpdatePackagingStatistics("manual",  parseInt(value, 10));
        break;
    }
    this.updateOrder();
  }

  onShipmentAttributeChange(event:any)
  {
    var sourceId: string;
    var value: any;

    console.log(event);
    if (event.source != null)
    {
      sourceId = event.source._id;
      value = event.source.value;
    }
    else if (event.srcElement != null)
    {
      sourceId = event.srcElement.id;
      value = event.srcElement.value;
    }
    console.log(sourceId + " changed ");

    switch(sourceId)
    {
      case "palletLength":
        this.orderHandler.shipments[0].palletLength = parseInt(value);
        break;
      
      case "palletWidth":
        this.orderHandler.shipments[0].palletWidth = parseInt(value);
        break;
      
      case "palletHeigth":
        this.orderHandler.shipments[0].palletHeigth = parseInt(value);
        break;
      
      case "palletWeigth":
        this.orderHandler.shipments[0].palletWeigth = parseInt(value);
        break;

      case "numberOfItemsToShip":
        this.orderHandler.shipments[0].numberOfItemsToShip = parseInt(value);
        break;
    }
    this.apiService
    .update(
      "orders/shipment",
      {
        "shipment" : this.orderHandler.shipments[0]
      }
    )
    .subscribe(
      (res: HttpResponse<any>) => {
        console.log("shipment updated: " + res);
        this.service
        .post(
          "orders/shipmentCost",
          {
            "forwarder" : this.orderHandler.details.forwarder, 
            "province" : this.orderHandler.details.customerDeliveryProvince,
            "len" : this.orderHandler.shipments[0].palletLength,
            "width" : this.orderHandler.shipments[0].palletWidth,
            "height" : this.orderHandler.shipments[0].palletHeigth,
            "weight" : this.orderHandler.shipments[0].palletWeigth
          }
        )
        .subscribe(
          (res: HttpResponse<any>)=>{  
            console.log(res);
            this.orderHandler.shipments[0].forwarderCost = res.body.shipmentCost;
            this.orderHandler.details.forwarderCost = res.body.shipmentCost;
          }
        );
        }
    );
  }

  updateOrder()
  {
    this.service
    .update(
      'orders/update/' + this.orderHandler.details.idOrder,
      {
        "order": this.orderHandler.details,
        "shipments": this.orderHandler.shipments,
      }
    )
    .subscribe(
        (res: HttpResponse<any>)=>{  
          console.log(res);
          res.body.order.requestedAssemblyDate = new Date(res.body.order.requestedAssemblyDate + 60000 * 120);
          res.body.order.effectiveAssemblyDate = new Date(res.body.order.effectiveAssemblyDate + 60000 * 120);
          res.body.order.shipmentDate = new Date(res.body.order.shipmentDate + 60000 * 120);
          var i: number;
          for(i = 0; i < this.orderList.length; i++)
          {
            if (this.orderList[i].idOrder == res.body.order.idOrder)
            {
              this.orderList[i] = res.body.order;
              break;
            }
          }
          // this.orderHandler.details = res.body.order;
    });
  }

  attributeInSet(stringArray: string[], value: string)
  {
    var isIn: boolean;
    isIn = false;
    try {
      isIn = stringArray.includes(value);
    }
    catch(err) {
      console.log(err.message);
      var i: number;
      for( i = 0; i < stringArray.length; i++)
      {
        if (stringArray[i].localeCompare(value) == 0)
        {
          isIn = true;
          break;
        }
      }
    }
    return isIn;
  }

  evalDate(v: string, x)
  {
    this.orderHandler.details.requestedAssemblyDate = new Date(v);
  }

  parseDate(date): Date {
    let d: Date;
    try {
      d = new Date(date);
    } catch {
      d = new Date();
    } finally {
      return d;
    }
  }
}


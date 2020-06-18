import { Component, OnInit, Input, Output } from '@angular/core';
import { Orders } from "@app/_models/orders";
import { ApiService } from '@app/_services/api.service';
import { OrderNotes } from "@app/_models/order-notes";
import { OrderHandler } from '@app/_models/order-handler';
import { OrderDetails } from '@app/_models/order-details';
import { MatSelectChange, NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS } from '@angular/material';
import { HttpResponse } from '@angular/common/http';
import { UserProfileConstants, UserProfile } from '@app/_models/user-profile';
import { EventEmitter } from '@angular/core';
import { StatusItem } from '@app/_models/status-item';
import { ListItem } from '@app/_models/list-item';
import { Articles } from '@app/_models/articles';
import { formatDate } from '@angular/common';
import { MatDialog, MatDialogConfig } from "@angular/material";
import { MsgBoxComponent } from '@app/_components/msg-box/msg-box.component';
import { CustomerDelivery } from '@app/_models/customer-delivery';

export const PICK_FORMATS = {
  parse: {dateInput: {day: 'numeric', month: 'numeric', year: 'numeric'}},
  display: {
      dateInput: 'input',
      monthYearLabel: {year: 'numeric', month: 'numeric'},
      dateA11yLabel: {year: 'numeric', month: 'numeric', day: 'numeric'},
      monthYearA11yLabel: {year: 'numeric', month: 'numeric'}
  }
};

export class PickDateAdapter extends NativeDateAdapter {
  format(date: Date, displayFormat: Object): string {
      if (displayFormat === 'input') {
          return formatDate(date,'dd-MM-yyyy',this.locale);;
      } else {
          return date.toDateString();
      }
  }
}


@Component({
  selector: 'app-order-handler',
  templateUrl: './order-handler.component.html',
  styleUrls: ['./order-handler.component.css'],
  providers: [
    {provide: DateAdapter, useClass: PickDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: PICK_FORMATS}
  ]
})

export class OrderHandlerComponent implements OnInit {
  @Input() orderHandler: OrderHandler;
  @Input() orderList: Orders[];
  @Input() orderDetails: OrderDetails[];
  @Input() profile: UserProfile;
  @Input() orderValue: number;

  @Output("getOrdersBasedOnFilters") getOrdersBasedOnFilters: EventEmitter<any> = new EventEmitter();
  
  private service: ApiService;
  
  public status: StatusItem[] = [
    { id: "SYS", des: "Inserito a sistema", selected: false },
    { id: "ONH", des: "Sospeso", selected: false },
    { id: "CON", des: "Confermato", selected: false },
    { id: "COE", des: "Confermato con eccezione", selected: false },
    { id: "PRE", des: "In preparazione", selected: false },
    { id: "RDY", des: "Pronto", selected: false },
    { id: "SHI", des: "Spedito", selected: false }
  ]

  public forwarder: ListItem[] = [
    { id: "CES", des: "CESPED", selected: false },
    { id: "TWS", des: "TWS - Collettame", selected: false },
    { id: "CLI", des: "Ritiro cliente", selected: false },
    { id: "DIR", des: "Consegna diretta", selected: false },
  ]

  public province: string;

  constructor(private apiService: ApiService,
              private dialog: MatDialog) {
    this.service = apiService;
  }

  ngOnInit()
  {
  }

  openDialog() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      id: 1,
      title: 'prova',
      message: 'Vuoi farti una pippa?'
    };
    // dialogConfig.position = {
    //   top: '100',
    //   left: '100'
    // };
    dialogConfig.height = '100px';
    dialogConfig.width = '200px';

    this.dialog.open(MsgBoxComponent, dialogConfig);
  }

  onOrderStatusChange(event:MatSelectChange)
  {
    var i: number;
    var y: number;

    for(i = 0; i < this.orderList.length; i++)
    {
      if (this.orderList[i].idOrder == this.orderHandler.details.idOrder)
      {
        this.orderList[i].status = event.source.value;
        break;
      }
    }
    console.log(this.orderHandler.details);

    this.service
      .update(
        'orders/update/' + this.orderHandler.details.idOrder,
        {
          "order": this.orderHandler.details,
          "buyValue" : this.orderValue | 0
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
                if (!this.profile.filters.filterWarehouse[UserProfileConstants.FILTER_WHAREHOUSE_READY])
                  this.getOrdersBasedOnFilters.emit();
                break;
              case "SHI":
                if (!this.profile.filters.filterShipment[UserProfileConstants.FILTER_SHIPMENT_COMPLETED])
                  this.getOrdersBasedOnFilters.emit();
                break;
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
                "buyValue": this.orderValue | 0
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
    var value: any;
    var customerDelivery: CustomerDelivery;

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

    this.service
      .get(
        "deliveries/order/" + this.orderHandler.details.idOrder
      )
      .subscribe(
        (res: HttpResponse<any>)=>{  
          console.log(res);
          customerDelivery = res.body.customerDelivery;
          customerDelivery.province = this.province;
          this.service
            .update(
              "deliveries/delivery",
              {
                "customerDelivery" : customerDelivery
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

  onAttributeChange(event:any)
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
        this.orderHandler.details.palletLength = parseInt(value);
        break;
      
      case "palletWidth":
        this.orderHandler.details.palletWidth = parseInt(value);
        break;
      
      case "palletHeigth":
        this.orderHandler.details.palletHeigth = parseInt(value);
        break;
      
      case "palletWeigth":
        this.orderHandler.details.palletWeigth = parseInt(value);
        break;

      case "numberOfItemsToShip":
        this.orderHandler.details.numberOfItemsToShip = parseInt(value);
        break;

      case "forwarder":
        this.orderHandler.details.forwarder = value;
        break;

      case "assemblyTime":
        this.orderUpdatePackagingStatistics("manual",  parseInt(value, 10));
        break;

    }

    this.service
      .update(
        'orders/update/' + this.orderHandler.details.idOrder,
        {
          "order": this.orderHandler.details,
          "buyValue" : this.orderValue | 0
        }
      )
      .subscribe(
          (res: HttpResponse<any>)=>{  
            console.log(res);
            res.body.order.preparationDate = new Date(res.body.order.preparationDate);
            res.body.order.shipmentDate = new Date(res.body.order.shipmentDate);
            this.orderList.forEach(item  => 
              {
                if (item.idOrder == res.body.order.idOrder)
                {
                  item = res.body.order;
                }
              }
            )
            this.orderHandler.details = res.body.order;
      });
  }

}

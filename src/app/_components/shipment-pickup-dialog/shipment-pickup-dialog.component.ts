import { Component, OnInit, Inject } from '@angular/core';
import { MatTableDataSource, MatDialogRef, MAT_DIALOG_DATA, 
         DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDialogConfig } from '@angular/material';
import { Shipment } from '@app/_models/shipment';
import { ApiService } from '@app/_services/api.service';
import { HttpResponse } from '@angular/common/http';
import { formatDate } from '@angular/common';
import { MomentDateAdapter, MAT_MOMENT_DATE_FORMATS, 
         MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';

import * as moment from 'moment';

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
  selector: 'app-shipment-pickup-dialog',
  templateUrl: './shipment-pickup-dialog.component.html',
  styleUrls: ['./shipment-pickup-dialog.component.css'],
  providers: [{
    provide: MAT_DATE_LOCALE,
    useValue: 'it'
  },
  {
    provide: MAT_DATE_FORMATS,
    useValue: MY_FORMATS
  }]
})
export class ShipmentPickupDialogComponent implements OnInit {

  private shipmentsDisplayedColumns: any[] = [
    { def: 'selected', hide: false }, 
    { def: 'customer', hide: false }, 
    { def: 'address', hide: false }, 
    { def: 'province', hide: false }, 
    { def: 'ddt',  hide: false }, 
    { def: 'insurance',  hide: false },
    { def: 'length', hide: false }, 
    { def: 'width', hide: false }, 
    { def: 'heigth', hide: false },  
    { def: 'weigth', hide: false },
    { def: 'note', hide: false }
  ];

  public forwarders: any[] = [
    { id: "CES", des: "CESPED", selected: false },
    { id: "TWS", des: "TWS - Collettame", selected: false },
    { id: "GLS", des: "GLS - Collettame", selected: false }
  ];

  public forwarderVar: string;

  public checkAll: boolean;
  public dataSource: MatTableDataSource<Shipment>;
  public title: string;
  public forwarder: string;
  public pickupDateVar: Date;

  private service: ApiService;
  private shipmentList: Shipment[];

  constructor(private dialogRef: MatDialogRef<ShipmentPickupDialogComponent>,
              private apiService: ApiService,
              @Inject(MAT_DIALOG_DATA) data) 
  {
    console.log(data.shipmentList);
    this.shipmentList = data.shipmentList;
    this.dataSource = new MatTableDataSource<Shipment>(this.shipmentList);
    this.title = data.title;
    this.forwarderVar = this.forwarder = data.forwarder;
    this.service = apiService;
  }

  ngOnInit() 
  {
  }

  getShipmentsDisplayedColumns():string[]
  {
    var a: string[] = this.shipmentsDisplayedColumns.filter(cd => !cd.hide).map(cd => cd.def);
    return a;
  }

  changeCheckStatus($event: any)
  {
    console.log(this.checkAll);
    this.shipmentList.forEach(element => { 
      element.selected = this.checkAll;
    });
  }

  sendEmail()
  {
    console.log(this.pickupDateVar);
    this.service
      .post(
        'utils/submitShipmentPickupRequest',
        {
          "forwarder": this.forwarderVar,
          "pickupDate": this.pickupDateVar,
          "shipmentList" : this.shipmentList
        }
      )
      .subscribe(
          (res: HttpResponse<any>)=>{
            console.log(res);
            window.alert("Messaggio spedito");
            this.dialogRef.close();
          }
      );
  }

  closeDialog(){
      this.dialogRef.close();
  }

  onForwarderChange(event:any)
  {
    console.log("get shipments for forwarder: '" + event + "'");
    this.service
    .post(
      'utils/createShipments',
      {
        'forwarder' : this.forwarderVar
      }
    )
    .subscribe(
      (res: HttpResponse<any>)=>{  
        console.log(res);
        this.dataSource = this.shipmentList = res.body.shipmentList;
      }
    );
  }
}

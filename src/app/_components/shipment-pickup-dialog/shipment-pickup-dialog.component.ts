import { Component, OnInit, Inject } from '@angular/core';
import { MatTableDataSource, MatDialogRef, MAT_DIALOG_DATA, 
         NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material';
import { Shipment } from '@app/_models/shipment';
import { ApiService } from '@app/_services/api.service';
import { HttpResponse } from '@angular/common/http';
import { formatDate } from '@angular/common';
import { MomentDateAdapter, MAT_MOMENT_DATE_FORMATS, 
         MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';

import * as _moment from 'moment';
// tslint:disable-next-line:no-duplicate-imports
// import { default as _rollupMoment} from 'moment';

const moment =  _moment; // _rollupMoment

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
  selector: 'app-shipment-pickup-dialog',
  templateUrl: './shipment-pickup-dialog.component.html',
  styleUrls: ['./shipment-pickup-dialog.component.css'],
  providers: [
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS},
    {provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true }}
  ]
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
    this.forwarder = data.forwarder;
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
    this.service
      .post(
        'utils/submitShipmentPickupRequest',
        {
          "forwarder": this.forwarder,
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
}

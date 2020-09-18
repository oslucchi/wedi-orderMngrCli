import { Component, OnInit, ɵConsole, ViewChild } from '@angular/core';
import { ApiService } from '@app/_services/api.service';
import { HttpResponse } from '@angular/common/http'; 
import { Orders } from '@app/_models/orders';
import { OrderNotes } from '@app/_models/order-notes';
import { OrderDetails } from '@app/_models/order-details';
import { MatTableDataSource } from '@angular/material/table';
import { ɵAnimationGroupPlayer } from '@angular/animations';
import { CookieService } from 'ngx-cookie-service';
import { UserProfile, UserProfileConstants } from '@app/_models/user-profile';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSelectChange, MatInput, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material';
import { MatSort } from '@angular/material/sort';
import { OrderHandler } from '@app/_models/order-handler';
import { OrderShipments } from '@app/_models/order-shipments';
import { Articles } from '@app/_models/articles';
import { StatusItem } from '@app/_models/status-item';
import { SearchFilters } from '@app/_models/search-filter';

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
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
  providers: [{
    provide: MAT_DATE_LOCALE,
    useValue: 'it'
  },
  {
    provide: MAT_DATE_FORMATS,
    useValue: MY_FORMATS
  }]
})

export class OrdersComponent implements OnInit {
  public bogusDataSource: MatTableDataSource<Orders>;
  public dataSource: MatTableDataSource<Orders>;
  public dataSourceDetails: MatTableDataSource<OrderDetails>;
  public dataSourceShipments: MatTableDataSource<OrderShipments>;
  public orderHandler: OrderHandler = new OrderHandler;
  public profile: UserProfile;
  public orderValue: number;
  public empty: " ";
  public orderList: Orders[];
  public orderDetails: OrderDetails[];

  private service: ApiService;
  private cookieService: CookieService;

  public status: StatusItem[] = [
    { id: "CAN", des: "Cancellato", selected: false, disabled: true },
    { id: "SYS", des: "Inserito a sistema", selected: false, disabled: true },
    { id: "ONH", des: "Sospeso", selected: false, disabled: true },
    { id: "CON", des: "Confermato", selected: false, disabled: true },
    { id: "COE", des: "Confermato con eccezione", selected: false, disabled: true },
    { id: "PRE", des: "In preparazione", selected: false, disabled: true },
    { id: "RDY", des: "Pronto", selected: false, disabled: true },
    { id: "SHI", des: "Spedito", selected: false, disabled: true },
    { id: "INV", des: "Fatturato", selected: false, disabled: true }
  ];

  public additionalSearchFilter: SearchFilters = new SearchFilters();
  // public additionalSearchFilterCustomer: string;
  // public additionalSearchFilterOrder: number;
  // public additionalSearchFilterFromDate: Date;
  // public additionalSearchFilterToDate: Date;

  private ordersDisplayedColumns: any[] = [
    { def: 'status', hide: false }, 
    { def: 'forwarder', hide: false }, 
    { def: 'orderRef', hide: false }, 
    { def: 'customerRefERP',  hide: false }, 
    { def: 'customerDescription', hide: false }, 
    { def: 'customerDeliveryProvince', hide: true }, 
    { def: 'requestedAssemblyDate', hide: false }, 
    { def: 'shipmentDate', hide: false }, 
    { def: 'sourceIssue', hide: false },
    { def: 'empty', hide: true },
    { def: 'compositionBoards', hide: false },
    { def: 'compositionTrays', hide: false },
    { def: 'compositionDesign', hide: false },
    { def: 'compositionAccessories', hide: false },
    { def: 'empty1', hide: false }
   ];
   private detailsDisplayedColumns: any[] = [
    { def: 'articleRefERP', hide: false }, 
    { def: 'articleDescription', hide: false }, 
    { def: 'articleSourceIssue', hide: false },
    { def: 'quantity', hide: false },
    { def: 'piecesFromSqm', hide: false },
    { def: 'articleUnityOfMeasure', hide: false },
   ];
   public timerSet: number = 1;
   public timerReset: boolean = false;
 
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(private apiService: ApiService,
               private cookieServ: CookieService) 
  {
    console.log("orders constructor");  
    this.service = apiService; 
    this.cookieService = cookieServ;
    this.bogusDataSource = new MatTableDataSource<Orders>();
  }

  getDetailsDisplayedColumns():string[]
  {
    return this.detailsDisplayedColumns.filter(cd=>!cd.hide).map(cd=>cd.def);
  }

  getOrdersDisplayedColumns():string[] 
  {
    if (this.profile.filters.filterInvoice[0] ||
        this.profile.filters.filterShipment[0])
    {
      this.ordersDisplayedColumns.find(x => x.def == 'shipmentDate').hide = false;
      this.ordersDisplayedColumns.find(x => x.def == 'requestedAssemblyDate').hide = true;
    }
    else
    {
      this.ordersDisplayedColumns.find(x => x.def == 'shipmentDate').hide = true;
      this.ordersDisplayedColumns.find(x => x.def == 'requestedAssemblyDate').hide = false;
    }
    return this.ordersDisplayedColumns.filter(cd=>!cd.hide).map(cd=>cd.def);
  }

  ngOnInit() {
    var i: number;
    var y: number;
    this.profile = new UserProfile(this.cookieService);

    this.profile.getProfile();
    console.log("userProfile:" +
                "\n\tfilterOrders: " + this.profile.filters.filterOrders + 
                "\n\tfilterWarehouse: " + this.profile.filters.filterOrders +
                "\n\tfilterShipment:" + this.profile.filters.filterShipment);
    this.getOrdersBasedOnFilters(false);
  }

  getOrderDetails()
  {
    var i: number;
    var y: number;

    i = 0;
    this.orderList.forEach(item => {
      item.shipmentDate = new Date(item.shipmentDate);
      item.requestedAssemblyDate = new Date(item.requestedAssemblyDate);
      item.effectiveAssemblyDate = new Date(item.effectiveAssemblyDate);
      if ((item.compositionBoards < 0) || i == 0)
      {
        this.service
          .get(
            'orders/allDetails/' + item.idOrder
          )
          .subscribe(
              (res: HttpResponse<any>)=>{ 
                if (i == 0)
                {
                  this.dataSourceDetails = new MatTableDataSource<OrderDetails>(res.body.orderDetails);
                  this.orderHandler = new OrderHandler;
                  this.orderHandler.details = item;
                  this.orderHandler.note = res.body.orderNotes;
                  this.orderHandler.shipments = res.body.orderShipments;
                  this.orderHandler.customerDelivery = res.body.customerDelivery;
                  this.orderHandler.statusPre = this.orderHandler.details.status;
                  this.orderHandler.customer = res.body.customer;
                  this.statusTransitionEval(item.status);
                  if (this.orderHandler.details.orderValue == 0)
                  {
                    this.orderValue = 0;
                    res.body.orderDetails.forEach( item => {
                      this.orderValue += 
                          res.body.orderArticles.find(x => x.idArticle === item.idArticle).buyPrice *
                                                              item.quantity * item.articleRateOfConversion;
                    });
                    this.orderValue = Math.floor(this.orderValue);
                  }
                  else
                  {
                    this.orderValue = Math.floor(this.orderHandler.details.orderValue);
                  }
                }
                this.orderDetails = res.body.orderDetails;

                if ((item.compositionAccessories == 0) &&
                    (item.compositionBoards == 0) &&
                    (item.compositionDesign == 0) &&
                    (item.compositionTrays == 0))
                {
                  for(y = 0; y < this.orderDetails.length; y++)
                  {
                    switch(this.orderDetails[y].articleCategory)
                    {
                      case "A":
                      case "TG":
                        item.compositionAccessories++;
                        break;
                      case "BS":
                        item.compositionBoards += (this.orderDetails[y].quantity / 
                                        this.orderDetails[y].articleRateOfConversion);
                        break;
                      case "D":
                        item.compositionDesign++;
                        break;
                      case "T":
                        item.compositionTrays++;
                        break;
                    }
                    if (this.orderDetails[y].sourceIssue)
                    {
                      if (item.sourceIssue == null)
                      {
                        item.sourceIssue = "";
                      }

                      if (item.sourceIssue.indexOf("X") < 0)
                      {
                        item.sourceIssue += "X";
                      }
                    }
                  }
                  this.service
                    .update(
                      "orders/update/" + item.idOrder,
                      {
                        "order" : item,
                        "shipments": res.body.orderShipments
                      }
                    )
                    .subscribe(
                      (res: HttpResponse<any>)=>{  
                        console.log(res);
                      }
                    );
                }
                i++;
              }
          );
      }
    });
  }

  orderListComparer(otherArray: Orders[])
  {
    return function(current: Orders){
      return otherArray.filter(function(other){
        return other.idOrder == current.idOrder
      }).length == 0;
    }
  }

  orderInArray(order: Orders, array: Orders[])
  {
    return array.some(function(item) {
      return order.idOrder === item.idOrder
    });
  }

  getOrdersBasedOnFilters(fromRefresh: boolean)
  {
    var i: number;
    var y: number;
    if (this.profile.getStatusWhereString() == "")
    {
      console.log("No filter selected, returning empty objects");
      this.dataSource = new MatTableDataSource<Orders>(new Array<Orders>());
      this.dataSourceDetails = new MatTableDataSource<OrderDetails>(new Array<OrderDetails>());
      this.orderHandler = new OrderHandler;
      this.setFilters();
      this.applyFilters();
      return;
    }
    this.service
      .post(
        'orders/byStatus',
        {
          "statusSet": this.profile.getStatusWhereString()
        }
      )
      .subscribe(
          (res: HttpResponse<any>)=>{
            if (fromRefresh)
            {
              var removeFromList = this.orderList.filter(this.orderListComparer(res.body.orderList));
              var addToList = res.body.orderList.filter(this.orderListComparer(this.orderList));
              if ((removeFromList.length != 0) || (addToList.length != 0))
              {
                var mergedOrderList: Orders[] = [];
                this.orderList.forEach(element => {
                  if (!this.orderInArray(element, removeFromList))
                  {
                    mergedOrderList.push(element);
                  }
                });
                this.orderList = mergedOrderList.concat(addToList);     
              }
              this.timerReset = true;
            }
            else
            {
              this.orderList = res.body.orderList;
            }
            this.dataSource = new MatTableDataSource<Orders>(this.orderList);
            this.dataSource.sort = this.sort;
            this.setFilters();
            this.getOrderDetails();
            this.applyFilters();
          }
      );
  }

  changeProfileFilters(event:MatCheckboxChange)
  {
    console.log("Event called on '" + event.source.id + "' with status '" + event.checked + "'");
    switch(event.source.id)
    {
      case 'SYS':
        this.profile.filters.filterOrders[0] = event.checked;
        if (!event.checked) this.profile.filters.filterOrders[4] = false;
        break;
      case 'PRE':
        this.profile.filters.filterWarehouse[0] = event.checked;
        if (!event.checked) this.profile.filters.filterWarehouse[2] = false;
        break;
      case 'SHI':
        this.profile.filters.filterShipment[0] = event.checked;
        break;
      case 'ONH':
        this.profile.filters.filterOrders[1] = event.checked;
        if (!event.checked) this.profile.filters.filterOrders[4] = false;
        break;
      case 'RDY':
        this.profile.filters.filterWarehouse[1] = event.checked;
        if (!event.checked) this.profile.filters.filterWarehouse[2] = false;
        break;
      case 'CON':
        this.profile.filters.filterOrders[2] = event.checked;
        if (!event.checked) this.profile.filters.filterOrders[4] = false;
        break;
      case 'COE':
        this.profile.filters.filterOrders[3] = event.checked;
        if (!event.checked) this.profile.filters.filterOrders[4] = false;
        break;
      case 'ORA':
        this.profile.filters.filterOrders[0] = event.checked;
        this.profile.filters.filterOrders[1] = event.checked;
        this.profile.filters.filterOrders[2] = event.checked;
        this.profile.filters.filterOrders[3] = event.checked;
        this.profile.filters.filterOrders[4] = event.checked;
        break;
      case 'WHA':
        this.profile.filters.filterWarehouse[0] = event.checked;
        this.profile.filters.filterWarehouse[1] = event.checked;
        this.profile.filters.filterWarehouse[2] = event.checked;
        break;
    }
    this.profile.setProfile();
    this.getOrdersBasedOnFilters(false);
  }

  statusTransitionEval(status: string)
  {
    this.status.find(x => x.id == "CAN").disabled = true;
    this.status.find(x => x.id == "ONH").disabled = true;
    this.status.find(x => x.id == "PRE").disabled = true;
    this.status.find(x => x.id == "SYS").disabled = true;
    this.status.find(x => x.id == "CON").disabled = true;
    this.status.find(x => x.id == "COE").disabled = true;
    this.status.find(x => x.id == "RDY").disabled = true;
    this.status.find(x => x.id == "SHI").disabled = true;
    this.status.find(x => x.id == "INV").disabled = true;
    
    switch(status)
    {
      case "SYS":
        this.status.find(x => x.id == "ONH").disabled = false;
        this.status.find(x => x.id == "CON").disabled = false;
        this.status.find(x => x.id == "COE").disabled = false;
        break;

      case "ONH":
        this.status.find(x => x.id == "CAN").disabled = false;
        this.status.find(x => x.id == "SYS").disabled = false;
        this.status.find(x => x.id == "CON").disabled = false;
        this.status.find(x => x.id == "COE").disabled = false;
        break;

      case "CON":
      case "COE":
        this.status.find(x => x.id == "ONH").disabled = false;
        this.status.find(x => x.id == "PRE").disabled = false;
        if (status == "COE")
        {
          this.status.find(x => x.id == "CON").disabled = false;
        }
        break;

      case "PRE":
        this.status.find(x => x.id == "RDY").disabled = false;
        break;

      case "RDY":
        this.status.find(x => x.id == "SHI").disabled = false;
        break;

      case "SHI":
        this.status.find(x => x.id == "INV").disabled = false;
        break;
      }
  }

  resetOrderStatus($event: any)
  {
    this.statusTransitionEval($event.event);
  }

  listOrderDetails(order: Orders) 
  {
    var i: number;
    if ((this.orderHandler != null) &&
        (order.idOrder == this.orderHandler.details.idOrder))
    {
      return;
    }

    this.orderValue = 0;
    this.service
      .get(
        'orders/allDetails/' + order.idOrder
      )
      .subscribe(
        (res: HttpResponse<any>)=>{
          if (this.orderHandler == null)
          {
            this.orderHandler = new OrderHandler;
          }

          if (this.orderHandler.details.idOrder != order.idOrder)
          {
            this.orderHandler.details = order;
            this.orderHandler.details.shipmentDate = new Date(order.shipmentDate);
            this.orderHandler.details.requestedAssemblyDate = new Date(order.requestedAssemblyDate);
            this.orderHandler.details.effectiveAssemblyDate = new Date(order.effectiveAssemblyDate);
                }
          this.orderDetails = res.body.orderDetails;
          this.dataSourceDetails = new MatTableDataSource<OrderDetails>(this.orderDetails);
          this.orderHandler.note = res.body.orderNotes;
          this.orderHandler.shipments = res.body.orderShipments;
          this.orderHandler.customerDelivery = res.body.customerDelivery;
          this.orderHandler.statusPre = this.orderHandler.details.status;
          this.orderHandler.customer = res.body.customer;
          this.statusTransitionEval(order.status);
          if (this.orderHandler.details.orderValue == 0)
          {
            this.orderValue = 0;
            res.body.orderDetails.forEach( item => {
              this.orderValue += 
                  res.body.orderArticles.find(x => x.idArticle === item.idArticle).buyPrice *
                                                      item.quantity * item.articleRateOfConversion;
            });
            this.orderValue = Math.floor(this.orderValue);
          }
          else
          {
            this.orderValue = Math.floor(this.orderHandler.details.orderValue);
          }

          return;
        }
      );
    this.dataSourceDetails = null;
    this.orderHandler = new OrderHandler;
  };
  
  setFilters()
  {
    var showRecord : boolean;

    this.dataSource.filterPredicate = (data, filter) => {
      // return (this.profile.filters.filterInvoice[0] || this.profile.filters.filterShipment[0] ?
      //               (this.additionalSearchFilter.fromDate != null ? data.shipmentDate >= this.additionalSearchFilter.fromDate : true) &&
      //               (this.additionalSearchFilter.toDate != null ? data.shipmentDate <= this.additionalSearchFilter.toDate : true)
      //           :
      //               (this.additionalSearchFilter.fromDate != null ? data.requestedAssemblyDate >= this.additionalSearchFilter.fromDate : true) &&
      //               (this.additionalSearchFilter.toDate != null ? data.requestedAssemblyDate <= this.additionalSearchFilter.toDate : true)) && 
      //         (this.additionalSearchFilter.order.trim() != "" ? data.orderRef.includes("IM0" + this.additionalSearchFilter.order) : true) && 
      //         (this.additionalSearchFilter.customer.trim() != "" ? data.customerRefERP.includes("I" + this.additionalSearchFilter.customer) : true);
      showRecord = true;
      if (this.additionalSearchFilter.customer && (this.additionalSearchFilter.customer != ""))
      {
        showRecord = showRecord && data.customerDescription.toUpperCase().includes(this.additionalSearchFilter.customer.toUpperCase());
      }
      if (this.additionalSearchFilter.order && (this.additionalSearchFilter.order != ""))
      {
        showRecord = showRecord && data.orderRef.includes(this.additionalSearchFilter.order);
      }
      if (this.additionalSearchFilter.fromDate)
      {
        showRecord = showRecord && data.shipmentDate >= this.additionalSearchFilter.fromDate;
      }
      if (this.additionalSearchFilter.toDate)
      {
        showRecord = showRecord && data.shipmentDate <= this.additionalSearchFilter.toDate;
      }
      return showRecord
    }
  }

  applyFilters()
  {
    this.dataSource.filter = "" + Math.random();
  }

  cancelFilters()
  {
    this.additionalSearchFilter = new SearchFilters();
    this.dataSource.filter = "" + Math.random();
  }
}

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
import { MatSelectChange, MatInput } from '@angular/material';
import { MatSort } from '@angular/material/sort';
import { OrderHandler } from '@app/_models/order-handler';
import { OrderShipments } from '@app/_models/order-shipments';
import { Articles } from '@app/_models/articles';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})

export class OrdersComponent implements OnInit {
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


  private ordersDisplayedColumns: any[] = [
    { def: 'status', hide: false }, 
    { def: 'forwarder', hide: false }, 
    { def: 'orderRef', hide: false }, 
    { def: 'customerRefERP',  hide: false }, 
    { def: 'customerDescription', hide: false }, 
    { def: 'customerDeliveryProvince', hide: true }, 
    { def: 'preparationDate', hide: false }, 
    { def: 'sourceIssue', hide: false },  
    { def: 'palletLength', hide: true },
    { def: 'palletWidth', hide: true },
    { def: 'palletHeigth', hide: true },
    { def: 'palletWeigth', hide: true },
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

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(private apiService: ApiService,
               private cookieServ: CookieService) 
  {
    console.log("orders constructor");  
    this.service = apiService; 
    this.cookieService = cookieServ;
  }

  getDetailsDisplayedColumns():string[]
  {
    return this.detailsDisplayedColumns.filter(cd=>!cd.hide).map(cd=>cd.def);
  }

  getOrdersDisplayedColumns():string[] 
  {
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
    this.getOrdersBasedOnFilters();
  }

  getOrderDetails()
  {
    var i: number;
    var y: number;

    i = 0;
    this.orderList.forEach(item => {
      item.shipmentDate = new Date(item.shipmentDate);
      item.preparationDate = new Date(item.preparationDate);
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
                  this.orderHandler.customerDelivery = res.body.customerDelivery;
                  this.orderValue = 0;
                  res.body.orderDetails.forEach( item => {
                    this.orderValue += 
                        res.body.orderArticles.find(x => x.idArticle === item.idArticle).buyPrice *
                                                            item.quantity * item.articleRateOfConversion;
                  });
        
                }
                this.orderDetails = res.body.orderDetails;

                item.compositionAccessories = 0;
                item.compositionBoards = 0;
                item.compositionDesign = 0;
                item.compositionTrays = 0;
                for(y = 0; y < this.orderDetails.length; y++)
                {
                  switch(this.orderDetails[y].articleCategory)
                  {
                    case "A":
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
                      "order" : item
                    }
                  )
                  .subscribe(
                    (res: HttpResponse<any>)=>{  
                      console.log(res);
                    }
                  );
                i++;
              }
          );
      }
    });
  }

  getOrdersBasedOnFilters()
  {
    var i: number;
    var y: number;
    if (this.profile.getStatusWhereString() == "")
    {
      console.log("No filter selected, returning empty objects");
      this.dataSource = new MatTableDataSource<Orders>(new Array<Orders>());
      this.dataSourceDetails = new MatTableDataSource<OrderDetails>(new Array<OrderDetails>());
      this.orderHandler = new OrderHandler;
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
            this.orderList = res.body.orderList;
            this.dataSource = new MatTableDataSource<Orders>(this.orderList);
            this.dataSource.sort = this.sort;
            this.getOrderDetails();
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
    this.getOrdersBasedOnFilters();
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
            this.orderHandler.details.preparationDate = new Date(order.preparationDate);
          }
          this.orderDetails = res.body.orderDetails;
          this.dataSourceDetails = new MatTableDataSource<OrderDetails>(this.orderDetails);
          this.orderHandler.note = res.body.orderNotes;
          this.orderHandler.shipments = res.body.orderShipments;
          this.orderHandler.customerDelivery = res.body.customerDelivery;
          this.orderValue = 0;
          this.orderDetails.forEach( item => {
            this.orderValue += res.body.orderArticles.find(x => x.idArticle === item.idArticle).buyPrice *
                               item.quantity * item.articleRateOfConversion;
          });
          return;
        }
      );
    this.dataSourceDetails = null;
    this.orderHandler = new OrderHandler;
  };
}
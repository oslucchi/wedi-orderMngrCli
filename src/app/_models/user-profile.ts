import { CookieService } from 'ngx-cookie-service';

export class UserProfileConstants {
    static readonly FILTER_ORDER_INSERTED: number = 0;
    static readonly FILTER_ORDER_ONHOLD: number = 1;
    static readonly FILTER_ORDER_CONFIRMED: number = 2;
    static readonly FILTER_ORDER_CONFIRMED_WITH_EXCEPTION: number = 3;
    static readonly FILTER_ORDER_CONFIRMED_ALL: number = 4;
    static readonly FILTER_WAREHOUSE_IN_PREPARATION: number = 0;
    static readonly FILTER_WHAREHOUSE_READY: number = 1;
    static readonly FILTER_WHAREHOUSE_ALL: number = 2;
    static readonly FILTER_SHIPMENT_COMPLETED: number = 0;
    static readonly FILTER_INVOICE_COMPLETED: number = 0;
}

export class Filters {
    public filterOrders: boolean[] = [ false, false, false, false, false ];
    public filterWarehouse: boolean[]  = [ false, false, false ];
    public filterShipment: boolean[]  = [ false];
    public filterInvoice: boolean[]  = [ false];
}

export class UserProfile {
    private cookieService: CookieService;
    private cookieValue: string;

    public filters: Filters;

    constructor(private cookieServ: CookieService)
    {
        this.cookieService = cookieServ;
        this.filters = new Filters();
        this.filters.filterOrders  = [ false, false, false, false, false ];
        this.filters.filterWarehouse = [ false, false, false ];
        this.filters.filterShipment = [ false ];
        this.filters.filterInvoice = [ false ];
    }
    
    getProfile()
    {
        var filter: any; 

        this.cookieValue = this.cookieService.get('userProfile');
        console.log("userProfile cookie: " + this.cookieValue);
    
        if (this.cookieValue == "")
        {
            this.filters.filterOrders = [true, true, true, true, true];
            this.filters.filterWarehouse = [false, false,  false];
            this.filters.filterShipment = [false];
            this.filters.filterInvoice = [false];
        }
        else
        {
            filter = JSON.parse(this.cookieValue);
            this.filters.filterOrders = filter.filterOrders;
            this.filters.filterWarehouse = filter.filterWarehouse;
            this.filters.filterShipment = filter.filterShipment;
            this.filters.filterInvoice = ("filterInvoice" in filter ? filter.filterInvoice : [ false ]);
        }
    }

    setProfile()
    {
        var now = new Date(), 
            expires = new Date(now.getFullYear() + 1, now.getMonth() + 1, now.getDate());
        var profileString = JSON.stringify(this.filters);
        
        this.cookieService.set('userProfile', profileString, expires);
    }

    getStatusWhereString()
    {
        var status: string = "";
        var sep : string= "";

        if (this.filters.filterOrders[UserProfileConstants.FILTER_ORDER_INSERTED])
        {
            status += sep + "'SYS'";
            sep = ",";
        }
        if (this.filters.filterOrders[UserProfileConstants.FILTER_ORDER_ONHOLD])
        {
            status += sep + "'ONH'";
            sep = ",";
        }
        if (this.filters.filterOrders[UserProfileConstants.FILTER_ORDER_CONFIRMED])
        {
            status += sep + "'CON'";
            sep = ",";
        }
        if (this.filters.filterOrders[UserProfileConstants.FILTER_ORDER_CONFIRMED_WITH_EXCEPTION])
        {
            status += sep + "'COE'";
            sep = ",";
        }
        if (this.filters.filterOrders[UserProfileConstants.FILTER_ORDER_CONFIRMED_ALL])
        {
            status += sep + "'SYS', 'ONH', 'CON', 'COE'";
            sep = ",";
        }
        if (this.filters.filterWarehouse[UserProfileConstants.FILTER_WAREHOUSE_IN_PREPARATION])
        {
            status += sep + "'PRE'";
            sep = ",";
        }
        if (this.filters.filterWarehouse[UserProfileConstants.FILTER_WHAREHOUSE_READY])
        {
            status += sep + "'RDY'";
            sep = ",";
        }
        if (this.filters.filterWarehouse[UserProfileConstants.FILTER_WHAREHOUSE_ALL])
        {
            status += sep + "'PRE', 'RDY'";
            sep = ",";
        }
        if (this.filters.filterShipment[UserProfileConstants.FILTER_SHIPMENT_COMPLETED])
        {
            status += sep + "'SHI'";
            sep = ",";
        }
        if (this.filters.filterInvoice[UserProfileConstants.FILTER_INVOICE_COMPLETED])
        {
            status += sep + "'INV'";
            sep = ",";
        }
        return(status);
    }
}

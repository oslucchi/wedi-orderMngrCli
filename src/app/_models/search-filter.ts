export class SearchFilters {
    customer: string;
    order: string;
    fromDate: Date;
    toDate: Date;

    SearchFilters()
    {
        this.customer = "";
        this.order = "";
        this.fromDate = new Date();
        this.toDate = new Date();
    }
}
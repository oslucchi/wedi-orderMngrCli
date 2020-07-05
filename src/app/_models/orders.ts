export class Orders {
	idOrder: number;
	status: string;
	idCustomer: number;
	idCustomerDelivery: number;
	requestedAssemblyDate:Date;
	effectiveAssemblyDate:Date;
	shipmentDate:Date;
    orderRef: string;
    transportDocNum: string;
    forwarder: string;
    forwarderCost: number;
    clientCost: number;
    assemblyTimeAuto: number;
    assemblyTime: number;
    palletCost: number;
    insuranceCost: number;
    customerRefERP: string;
    customerDescription: string;
    customerDeliveryProvince: string;
    compositionBoards: number;
    compositionTrays: number;
    compositionDesign: number;
    compositionAccessories: number;
    sourceIssue: string;
    orderValue: number;
    selected: boolean;
}

export class OrderShipments {
    idOrderShipment: number;
    idOrder: number;
	forwarder: string;
	palletLength: number;
	palletWidth: number;
	palletHeigth: number;
	palletWeigth: number;
	numberOfItemsToShip: number;
	costForwarder: number;
	costClient: number;
	assemblyDate: Date;
    shipmentDate: Date;
}
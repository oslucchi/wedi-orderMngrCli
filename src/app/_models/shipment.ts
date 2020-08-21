export class Shipment {
    idOrder: number;
    customer: string;
    address: string;
    city: string;
    zipCode: string;
    province: string;
    ddt: string;
    ddtDate: Date;
    note: string;
    insurance: string;
    insuranceCost: number;
    length: number;
    width: number;
    heigth: number
    weigth: number;
    volumicWeigth: number;
    orderValue: number;
    orderReference: string;
    numOfItems: number;
    customerMail: string;
    selected: boolean;
}

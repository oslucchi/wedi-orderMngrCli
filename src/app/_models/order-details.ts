export interface OrderDetails {
    idOrderDetails: number;
    idOrder: number;
    idArticle: number;
    quantity: number;
    piecesFromSqm: number;
    cost: number;
    articleRefERP: string;
    articleCategory: string;
    articleDescription: string;
    articleUnityOfMeasure: string;
    articleRateOfConversion: number;
    sourceIssue: number;
}

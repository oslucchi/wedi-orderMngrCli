import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AuthenticationService,  } from '@app/_services/authentication.service';
import { ApiService  } from '@app/_services/api.service';
import { StorageService } from '@app/_services/storage.service';
import { AlertService } from '@app/_services/alert.service';
import { OrderDetails } from '@app/_models/order-details';
import { HttpResponse } from '@angular/common/http'; 

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {
    private service: ApiService;
    private orderDetails: OrderDetails[] = [];

    loginForm: FormGroup;
    loading = false;
    submitted = false;
    returnUrl: string;

    constructor(
            private formBuilder: FormBuilder,
            private route: ActivatedRoute,
            private router: Router,
            private authenticationService: AuthenticationService,
            private alertService: AlertService,
            private apiService: ApiService,
            private storage: StorageService
        ) 
    {
        // redirect to home if already logged in
        if (this.authenticationService.currentUserValue) {
            this.router.navigate(['/']);
        }
        this.service = apiService;
    }

    ngOnInit() {
        this.orderDetails = [
            {   
                idOrderDetails: 0,
                idOrder: 1,
                idArticle: 2,
                quantity: 3,
                piecesFromSqm: 1,
                cost: 4,
                sourceIssue: 0,
                articleRefERP: "", 
                articleCategory: "",
                articleDescription: "", 
                articleUnityOfMeasure: "",
                articleRateOfConversion: 1.0
            },
            {   
                idOrderDetails: 0,
                idOrder: 1,
                idArticle: 12,
                quantity: 13,
                piecesFromSqm: 1,
                cost: 14,
                sourceIssue: 0,
                articleRefERP: "", 
                articleCategory: "",
                articleDescription: "", 
                articleUnityOfMeasure: "",
                articleRateOfConversion: 1.0
            }
        ];       
        
        this.loginForm = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });

        this.service.post(
            'orders/insert', 
            {
                "order" : {
                    "idOrder" : 0,
                    "idCustomer" : 1,
                    "status" : "A",
                    "preparationDate" : "1970-01-01",
                    "shipmentDate" : "1970-01-01",
                    "palletLength" : 250, 
                    "palletWidth" : 120, 
                    "palletHeigth" : 60, 
                    "palletWeigth" : 90,
                    "orderRef" : "IM019049",
                    "transportDocNum" : "DTV202000546",
                    "forwarder" : "CES",
                    "forwardCost" : 36.25,
                    "clientCost" : 90,
                    "assemblyForecast" : 20,
                    "assemblyTime" : 30,
                    "palletCost" : 20,
                    "insuranceCost" : 5 
                },
                "orderDetails" : this.orderDetails
            }
          )
          .subscribe(
              (res: HttpResponse<any>)=> {
                console.log("Result '" + res + "'");
              }
          )
        // get return url from route parameters or default to '/'
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    // convenience getter for easy access to form fields
    get f() { return this.loginForm.controls; }

    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.loginForm.invalid) {
            return;
        }

        this.loading = true;
        this.authenticationService.login(this.f.username.value, this.f.password.value)
            .pipe(first())
            .subscribe(
                data => {
                    this.router.navigate([this.returnUrl]);
                },
                error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            );
    }
}
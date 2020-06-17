import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from '@app/_components/login/login.component';
import { FormsModule } from '@angular/forms'
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { OrdersComponent } from './_components/orders/orders.component';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CookieService } from 'ngx-cookie-service'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule, MatDatepickerModule, MatNativeDateModule, MatSortModule, MatDialogModule } from '@angular/material';
import { OrderHandlerComponent } from './_components/order-handler/order-handler.component';
import { MsgBoxComponent } from './_components/msg-box/msg-box.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    OrdersComponent,
    OrderHandlerComponent,
    MsgBoxComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatSortModule,
    MatDialogModule
  ],
  providers: [CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }

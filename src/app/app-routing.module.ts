import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from '@app/_components/login/login.component';
import { OrdersComponent } from './_components/orders/orders.component';

const routes: Routes = [
  { path: 'orders', component: OrdersComponent },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'orders', pathMatch: 'full'},
  { path: '**', redirectTo: 'orders', pathMatch: 'full'}
];
@NgModule({
  imports: [RouterModule.forRoot(routes, {
                useHash : true
              })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
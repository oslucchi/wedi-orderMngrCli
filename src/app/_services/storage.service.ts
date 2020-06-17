import { Injectable } from '@angular/core';
import { environment } from "environments/environment";
import { LoginComponent } from '@app/_components/login/login.component';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  public host: String;
  public baseURL: String;
  public baseHref: String;
  public useExtension: boolean;
  public profiles: {
      est: string;
      west: string;
      north: string;
      tileHeight: number;
  };
  public landingComponentData: LoginComponent;

  public constructor() {
    this.host = environment.host;
    this.baseURL = environment.baseURL;
    this.baseHref = environment.baseHref;
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ILogin } from 'src/app/account/login/login.component';
import { IRegister } from 'src/app/account/register/register.component';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiResource = 'http://localhost:3000/accounts';

  constructor(private http: HttpClient) { }

  login(resource: ILogin) {
    const url = `${this.apiResource}/login`;
    return this.http.post(url, resource).toPromise();
  }

  register(resource: IRegister) {
    const url = `${this.apiResource}/register`;
    return this.http.post(url, resource).toPromise();
  }

  validateEmail(code: any) {
    const url = `${this.apiResource}/validate-email`;
    return this.http.post(url, code).toPromise();
  }
}

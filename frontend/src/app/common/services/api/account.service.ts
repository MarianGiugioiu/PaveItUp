import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ILogin } from 'src/app/account/login/login.component';
import { IRegister } from 'src/app/account/register/register.component';
import { IResetPassword } from 'src/app/account/reset-password/reset-password.component';
import { LocalStorageService } from '../local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiResource = 'http://localhost:3000/accounts';

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
    ) { }

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

  sendResetPasswordCode(account: any) {
    const url = `${this.apiResource}/send-reset-password-code`;
    return this.http.post(url, account).toPromise();
  }

  validateResetPasswordCode(code: any) {
    const url = `${this.apiResource}/validate-reset-password-code`;
    return this.http.post(url, code).toPromise();
  }

  resetPassword(resource: IResetPassword) {
    const url = `${this.apiResource}/reset-password`;
    return this.http.patch(url, resource).toPromise();
  }

  changeName(resource: any) {
    const token = this.localStorageService.getItem('access_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${this.apiResource}/change-name`;
    return this.http.patch(url, resource, { headers }).toPromise();
  }

  changePassword(resource: any) {
    const token = this.localStorageService.getItem('access_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${this.apiResource}/change-password`;
    return this.http.patch(url, resource, { headers }).toPromise();
  }
}

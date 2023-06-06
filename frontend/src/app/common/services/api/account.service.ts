import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ILogin } from 'src/app/account/login/login.component';

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
}

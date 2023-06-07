import { Component } from '@angular/core';
import { AppComponent } from '../../app.component';
import { SVGEnum } from '../../common/enums/svg.enum';
import { AccountService } from 'src/app/common/services/api/account.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { LocalStorageService } from 'src/app/common/services/local-storage.service';

export interface ILogin {
  username: string;
  password: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public loginData: ILogin;
  public error: string;
  public SVGEnum = SVGEnum;

  constructor (
    private appComponent: AppComponent,
    private accountService: AccountService,
    public router: Router,
    private spinner: NgxSpinnerService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit() {
    this.loginData = {
      username: '',
      password: ''
    }
  }

  checkFields() {
    if (this.loginData.username.length < 3 || this.loginData.username.length > 100 || this.loginData.password.length < 3 || this.loginData.password.length > 30) {
      this.error = 'Username or password are incorrect';
      return false;
    }
    this.error = '';
    return true;
  }

  login() {
    this.spinner.show();
    if (!this.checkFields()) {
      this.spinner.hide();
      return;
    }
    this.accountService.login(this.loginData)
    .then((result) => {
      this.localStorageService.setItem('access_token', result['token']);
      this.localStorageService.setItem('account_name', result['name']);
      this.localStorageService.setItem('account_authority', result['authority']);
      this.appComponent.afterLogin();
      this.spinner.hide();
      this.router.navigate(['/']);
    })
    .catch((error) => {
      if (error.status === 403) {
        this.error = "The account was not validated";
      } else if (error.status === 400) {
        this.error = 'Username or password are incorrect';
      }
      this.spinner.hide();
    })
  }

  clearError() {
    this.error = undefined;
  }

  goToRegister() {
    this.router.navigate(['/account/register']);
  }

  goToForgotPassword() {
    this.router.navigate(['/account/forgot-password']);
  }
}

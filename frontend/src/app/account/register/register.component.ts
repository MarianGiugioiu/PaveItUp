import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppComponent } from 'src/app/app.component';
import { SVGEnum } from 'src/app/common/enums/svg.enum';
import { AccountService } from 'src/app/common/services/api/account.service';

export interface IRegister {
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  public registerData: IRegister;
  public errorMessage: string;
  public successMessage: string;
  public fieldError: IRegister;
  public SVGEnum = SVGEnum;

  constructor (
    private appComponent: AppComponent,
    private accountService: AccountService,
    public router: Router,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit() {
    this.registerData = {
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
    }

    this.fieldError = {
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
    }
  }

  showPopup() {
    this.appComponent.openPopupValidation();
  }

  checkName() {
    if (this.registerData.name.length < 3 || this.registerData.name.length > 50 || !/^[a-zA-Z]/.test(this.registerData.name)) {
      this.fieldError.name = 'invalid name';
      return false;
    }
    this.fieldError.name = '';
    return true;
  }

  checkUsername() {
    if (this.registerData.username.length < 3 || this.registerData.username.length > 100) {
      this.fieldError.username = 'invalid username';
      return false;
    }
    this.fieldError.username = '';
    return true;
  }

  checkPassword() {
    const digitRegex = /\d/;
    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const symbolRegex = /[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]/;
    if (this.registerData.password.length < 3 || this.registerData.password.length > 30
        || !digitRegex.test(this.registerData.password)
        || !uppercaseRegex.test(this.registerData.password)
        || !lowercaseRegex.test(this.registerData.password)
        || !symbolRegex.test(this.registerData.password)) {
      this.fieldError.password = 'invalid password';
      return false;
    }
    this.fieldError.password = '';
    return true;
  }

  checkConfirmPassword() {
    if (this.registerData.confirmPassword !== this.registerData.password) {
      this.fieldError.confirmPassword = 'passwords must be identical';
      return false;
    }
    this.fieldError.confirmPassword = '';
    return true;
  }

  register() {
    this.spinner.show();
    this.successMessage = '';
    this.errorMessage = '';
    const validName = this.checkName();
    const validUsername = this.checkUsername();
    const validPassword = this.checkPassword();
    const validConfirmPassword = this.checkConfirmPassword();
    if (!validName || !validUsername || !validPassword || !validConfirmPassword) {
      this.spinner.hide();
      return;
    }
    this.accountService.register(this.registerData)
    .then(() => {
      this.successMessage = 'Account registered. Head to your email to validate it!';
      this.spinner.hide();
    })
    .catch((error) => {
      if (error.error.message === 'Resource already exists') {
        this.errorMessage = "An account with this username already exists";
      } else if (error.error.message === 'Error sending email') {
        this.errorMessage = "There was a problem when sending the validation mail";
      }
      this.spinner.hide();
    });
  }

  clearError(field: string) {
    this.fieldError[field] = '';
    this.errorMessage = undefined;
  }
}

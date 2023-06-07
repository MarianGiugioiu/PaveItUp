import { Component } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { SVGEnum } from 'src/app/common/enums/svg.enum';
import { AccountService } from 'src/app/common/services/api/account.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  public username = '';
  public errorMessage: string;
  public successMessage: string;
  public SVGEnum = SVGEnum;

  constructor (
    private accountService: AccountService,
    private spinner: NgxSpinnerService
  ) {}

  checkField() {
    if (this.username.length < 3 || this.username.length > 100) {
      this.errorMessage = 'Username is not valid';
      return false;
    }
    this.errorMessage = '';
    return true;
  }

  sendResetPasswordCode() {
    this.spinner.show();
    if (!this.checkField()) {
      this.spinner.hide();
      return;
    }
    this.accountService.sendResetPasswordCode({username: this.username})
    .then(() => {
      this.successMessage = 'Reset password code created. Head to your email to use it!';
      this.spinner.hide();
    })
    .catch((error) => {
      if (error.error.message === 'Error sending email') {
        this.errorMessage = "There was a problem when sending the validation mail";
      }
      this.spinner.hide();
    });
  }
}

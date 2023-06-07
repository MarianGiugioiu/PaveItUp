import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppComponent } from 'src/app/app.component';
import { SVGEnum } from 'src/app/common/enums/svg.enum';
import { AccountService } from 'src/app/common/services/api/account.service';

export interface IResetPassword {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  resetPasswordCode?: string;
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  public errorMessageValidation = 'Validating...';
  public resetPasswordData: IResetPassword;
  public errorMessage: string;
  public successMessage: string;
  public fieldError: IResetPassword;
  public SVGEnum = SVGEnum;

  constructor (
    private appComponent: AppComponent,
    private accountService: AccountService,
    public router: Router,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit() {
    this.spinner.show();
    this.resetPasswordData = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    }

    this.fieldError = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
    
    const resetPasswordCode = this.route.snapshot.paramMap.get('code');
    this.accountService.validateResetPasswordCode({resetPasswordCode})
    .then(() => {
      this.errorMessageValidation = '';
      this.resetPasswordData.resetPasswordCode = resetPasswordCode;
      this.spinner.hide();
    })
    .catch((error) => {
      if (error.status === 400) {
        if (error.error.message === 'The reset password code is expired') {
          this.errorMessageValidation = 'The reset password code is expired';
        } else {
          this.errorMessageValidation = 'Validation code is invalid';
        }
      }
      this.spinner.hide();
    });
  }

  checkPassword(field: string) {
    const digitRegex = /\d/;
    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const symbolRegex = /[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]/;
    
    if (this.resetPasswordData[field].length < 3 || this.resetPasswordData[field].length > 30
        || !digitRegex.test(this.resetPasswordData[field])
        || !uppercaseRegex.test(this.resetPasswordData[field])
        || !lowercaseRegex.test(this.resetPasswordData[field])
        || !symbolRegex.test(this.resetPasswordData[field])) {
      this.fieldError[field] = 'invalid password';
      return false;
    }
    if (field === 'newPassword' && this.resetPasswordData.oldPassword === this.resetPasswordData.newPassword) {
      this.fieldError.newPassword = 'new password must be different';
      return false;
    }
    this.fieldError[field] = '';
    return true;
  }

  checkConfirmPassword() {
    if (this.resetPasswordData.confirmPassword !== this.resetPasswordData.newPassword) {
      this.fieldError.confirmPassword = 'passwords must be identical';
      return false;
    }
    this.fieldError.confirmPassword = '';
    return true;
  }

  checkIdenticalPasswords() {
    if (this.resetPasswordData.oldPassword === this.resetPasswordData.newPassword) {
      this.fieldError.newPassword = 'new password must be different';
      return false;
    }
    this.fieldError.newPassword = '';
    return true;
  }

  resetPassword() {
    this.spinner.show();
    const validOldPassword = this.checkPassword('oldPassword');
    const validNewPassword = this.checkPassword('newPassword');
    const validConfirmPassword = this.checkConfirmPassword();
    if (!validOldPassword || !validNewPassword || !validConfirmPassword) {
      this.spinner.hide();
      return;
    }
    this.accountService.resetPassword(this.resetPasswordData)
    .then(() => {
      this.successMessage = 'Password successfully changed';
      this.spinner.hide();
    })
    .catch((error) => {
      if (error.error.message === 'The old password is incorrect') {
        this.errorMessage = error.error.message;
      }
      this.spinner.hide();
    });
  }

  clearError(field: string) {
    this.fieldError[field] = '';
    this.errorMessage = undefined;
  }

  showPopup() {
    this.appComponent.openPopupValidation();
  }
}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppComponent } from 'src/app/app.component';
import { EventsEnum } from 'src/app/common/enums/events.enum';
import { SVGEnum } from 'src/app/common/enums/svg.enum';
import { AccountService } from 'src/app/common/services/api/account.service';
import { EventsService } from 'src/app/common/services/events.service';
import { LocalStorageService } from 'src/app/common/services/local-storage.service';

export interface IDetails {
  initialName?: string;
  name: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent {
  public detailsData: IDetails;
  public errorMessage: string;
  public successMessage: string;
  public fieldError: IDetails;
  public SVGEnum = SVGEnum;
  private eventSubscription;

  constructor (
    private appComponent: AppComponent,
    private accountService: AccountService,
    public router: Router,
    private spinner: NgxSpinnerService,
    private localStorageService: LocalStorageService,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    const token = this.localStorageService.getItem('access_token');
    if (!token) {
      this.router.navigate(['/account/login']);
      return;
    }
    const name = this.localStorageService.getItem('account_name');

    this.detailsData = {
      initialName: name,
      name,
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    }

    this.fieldError = {
      name: '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    }

    this.eventSubscription = this.eventsService.subscribe(EventsEnum.logout, () => {
      this.router.navigate(['/']);
    });
  }

  ngOnDestroy() {
    this.eventSubscription.unsubscribe();
  }

  showPopup() {
    this.appComponent.openPopupValidation();
  }

  checkName() {
    if (this.detailsData.name.length < 3 || this.detailsData.name.length > 50 || !/^[a-zA-Z]/.test(this.detailsData.name)) {
      this.fieldError.name = 'invalid name';
      return false;
    }
    this.fieldError.name = '';
    return true;
  }

  checkPassword(field: string) {
    const digitRegex = /\d/;
    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const symbolRegex = /[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]/;
    
    if (this.detailsData[field].length < 3 || this.detailsData[field].length > 30
        || !digitRegex.test(this.detailsData[field])
        || !uppercaseRegex.test(this.detailsData[field])
        || !lowercaseRegex.test(this.detailsData[field])
        || !symbolRegex.test(this.detailsData[field])) {
      this.fieldError[field] = 'invalid password';
      return false;
    }

    this.fieldError[field] = '';
    return true;
  }

  checkConfirmPassword() {
    if (this.detailsData.confirmPassword !== this.detailsData.newPassword) {
      this.fieldError.confirmPassword = 'passwords must be identical';
      return false;
    }
    this.fieldError.confirmPassword = '';
    return true;
  }

  async save() {
    this.spinner.show();
    this.successMessage = '';
    this.errorMessage = '';
    if (this.detailsData.name !== this.detailsData.initialName) {
      const validName = this.checkName();
      if (validName) {
        try {
          await this.accountService.changeName({newName: this.detailsData.name});
          this.successMessage = 'Account details changed';
          this.detailsData.initialName = this.detailsData.name;
          this.appComponent.changeName(this.detailsData.name);
          this.spinner.hide();
        } catch(error) {
          if (error.error.message === 'Token is not valid') {
            this.router.navigate(['/account/login']);
          }
          this.successMessage = '';
          this.spinner.hide();
        }
      }
    }

    if (this.detailsData.newPassword) {
      const validOldPassword = this.checkPassword('oldPassword');
      const validNewPassword = this.checkPassword('newPassword');
      const validConfirmPassword = this.checkConfirmPassword();
      if (validOldPassword && validNewPassword && validConfirmPassword) {
        try {
          await this.accountService.changePassword({oldPassword: this.detailsData.oldPassword, newPassword: this.detailsData.newPassword});
          this.successMessage = 'Account details changed';
          this.detailsData.oldPassword = '';
          this.detailsData.newPassword = '';
          this.detailsData.confirmPassword = '';
          this.spinner.hide();
        } catch(error) {
          this.successMessage = '';
          if (error.error.message === 'The old password is incorrect' || error.error.message === 'The new password is identical to the old one') {
            this.errorMessage = error.error.message;
          }
          if (error.error.message === 'Token is not valid') {
            this.router.navigate(['/account/login']);
          }
          this.spinner.hide();
        }
      }
    }
    this.spinner.hide();
  }

  clearError(field: string) {
    this.fieldError[field] = '';
    this.errorMessage = undefined;
  }
}

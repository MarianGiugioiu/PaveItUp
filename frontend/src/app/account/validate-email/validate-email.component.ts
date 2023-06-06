import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AccountService } from 'src/app/common/services/api/account.service';

@Component({
  selector: 'app-validate-email',
  templateUrl: './validate-email.component.html',
  styleUrls: ['./validate-email.component.scss']
})
export class ValidateEmailComponent {
  public successMessage: string;
  public errorMessage: string;
  
  constructor (
    private accountService: AccountService,
    public router: Router,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
  ) {}

  ngOnInit() {
    this.spinner.show();
    const validationCode = this.route.snapshot.paramMap.get('code');
    this.accountService.validateEmail({validationCode})
    .then((result) => {
      this.successMessage = result['message'];
      this.spinner.hide();
    })
    .catch((error) => {
      if (error.status === 400) {
        if (error.error.message === 'Email was already validated') {
          this.errorMessage = 'Email was already validated';
        } else {
          this.errorMessage = 'Validation code is invalid';
        }
      }
      this.spinner.hide();
    });
  }

  goToLogin() {
    this.router.navigate(['/account/login']);
  }
}

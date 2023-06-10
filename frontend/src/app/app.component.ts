import { Component, OnInit } from '@angular/core';
import { SVGEnum } from './common/enums/svg.enum';
import { Router } from '@angular/router';
import { LocalStorageService } from './common/services/local-storage.service';
import { EventsService } from './common/services/events.service';
import { EventsEnum } from './common/enums/events.enum';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public SVGEnum = SVGEnum;
  showPopup = false;
  popupPage = 0;
  connected = false;
  name: string;
  authority: string;

  constructor (
    public router: Router,
    private localStorageService: LocalStorageService,
    public eventsService: EventsService
  ) {

  }

  ngOnInit() {
    const token = this.localStorageService.getItem('access_token');
    if (!token) {
      this.connected = false;
    } else {
      this.connected = true;
      this.name = this.localStorageService.getItem('account_name');
      this.authority = this.localStorageService.getItem('account_authority');
    }
  }

  goToLogin() {
    this.router.navigate(['/account/login']);
  }

  goToRegister() {
    this.router.navigate(['/account/register']);
  }

  goToDetails() {
    this.router.navigate(['/account/details']);
  }

  goHome() {
    this.router.navigate(['/']);
  }

  openPopup() {
    this.popupPage = 0;
    this.showPopup = true;
  }

  openPopupValidation() {
    this.popupPage = 1;
    this.showPopup = true;
  }

  afterLogin() {
    this.name = this.localStorageService.getItem('account_name');
    this.authority = this.localStorageService.getItem('account_authority');
    this.connected = true;
  }

  changeName(name: string) {
    this.localStorageService.setItem('account_name', name);
    this.name = name;
  }

  logout() {
    this.eventsService.publish(EventsEnum.logout);
    this.localStorageService.removeItem('account_name');
    this.localStorageService.removeItem('account_authority');
    this.localStorageService.removeItem('access_token');
    this.router.navigate(['/']);
    this.connected = false;
  }

  logoutToLogin() {
    this.eventsService.publish(EventsEnum.logout);
    this.localStorageService.removeItem('account_name');
    this.localStorageService.removeItem('account_authority');
    this.localStorageService.removeItem('access_token');
    this.router.navigate(['/account/login']);
    this.connected = false;
  }

  goToWorkspaces() {
    this.router.navigate(['/workspaces']);
  }

  goToValidation() {
    this.router.navigate(['/validate-shapes']);
  }

  closePopup() {
    this.showPopup = false;
  }
}

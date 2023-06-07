import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LocalStorageService } from '../common/services/local-storage.service';
import { EventsService } from '../common/services/events.service';
import { EventsEnum } from '../common/enums/events.enum';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  public showLoginButton = false;
  private eventSubscription;

  constructor (
    public router: Router,
    private localStorageService: LocalStorageService,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    const token = this.localStorageService.getItem('access_token');
    if (!token) {
      this.showLoginButton = true;
    } else {
      this.showLoginButton = false;
    }

    this.eventSubscription = this.eventsService.subscribe(EventsEnum.logout, () => {
      this.showLoginButton = true;
    });
  }

  ngOnDestroy() {
    this.eventSubscription.unsubscribe();
  }

  logout() {
    this.showLoginButton = true;
  }

  goToLogin() {
    this.router.navigate(['/account/login']);
  }

  goToWorkspaces() {
    this.router.navigate(['/workspaces']);
  }
}

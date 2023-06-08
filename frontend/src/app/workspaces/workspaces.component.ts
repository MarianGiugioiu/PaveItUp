import { Component, OnInit } from '@angular/core';
import { WorkspaceService } from '../common/services/api/workspace.service';
import { Router } from '@angular/router';
import { IWorkspace } from '../workspace/workspace.component';
import { SVGEnum } from '../common/enums/svg.enum';
import { NgxSpinnerService } from 'ngx-spinner';
import { LocalStorageService } from '../common/services/local-storage.service';
import { EventsService } from '../common/services/events.service';
import { EventsEnum } from '../common/enums/events.enum';

@Component({
  selector: 'app-workspaces',
  templateUrl: './workspaces.component.html',
  styleUrls: ['./workspaces.component.scss']
})
export class WorkspacesComponent implements OnInit {
  public workspaces: IWorkspace[];
  public getImageData = {};
  public selectedWorkspace: IWorkspace;
  public initOldWorkspaces = -1;
  public hideWorkspaces = true;

  public SVGEnum = SVGEnum;

  public JSON = JSON;

  public workspacesPage = 0;
  private eventSubscription;

  constructor(
    public workspaceService: WorkspaceService,
    public router: Router,
    private spinner: NgxSpinnerService,
    private localStorageService: LocalStorageService,
    private eventsService: EventsService,
  ) { }

  async ngOnInit() {
    this.eventSubscription = this.eventsService.subscribe(EventsEnum.logout, () => {
      this.router.navigate(['/']);
    });
    const token = this.localStorageService.getItem('access_token');
    if (!token) {
      this.router.navigate(['/account/login']);
      return;
    }
    this.spinner.show();
    this.hideWorkspaces = true;
    try {
      this.workspaces = await this.workspaceService.getAll(this.workspacesPage);
      if (this.workspaces.length) {
        this.initOldWorkspaces = 0;
        this.selectedWorkspace = this.workspaces[this.initOldWorkspaces];
        setTimeout(() => {
          this.getImageData[this.selectedWorkspace.id] = true;
        }, 100);
      } else {
        this.hideWorkspaces = false;
        this.spinner.hide();
      }
    } catch (error) {
      if (error.error.message === 'Token is not valid') {
        this.router.navigate(['/account/login']);
      }
      this.workspaces = [];
      this.hideWorkspaces = false;
      this.spinner.hide();
    }
  }

  ngOnDestroy() {
    this.eventSubscription.unsubscribe();
  }

  async onLastElementInView() {
    await this.loadMoreData();
  }

  async loadMoreData() {
    this.spinner.show();
    this.workspacesPage++;
    this.hideWorkspaces = true;
    try {
      let newWorkspaces = await this.workspaceService.getAll(this.workspacesPage);
      if (newWorkspaces.length) {
        this.initOldWorkspaces = this.workspaces.length;
        this.workspaces = this.workspaces.concat(newWorkspaces);
        this.selectedWorkspace = this.workspaces[this.initOldWorkspaces];
        setTimeout(() => {
          this.getImageData[this.selectedWorkspace.id] = true;
        }, 100);
      } else {
        this.hideWorkspaces = false;
        this.spinner.hide();
      }
    } catch (e) {
      this.hideWorkspaces = false;
      this.spinner.hide();
    }
  }

  updateGetImageData(workspace, image) {
    if (this.initOldWorkspaces !== -1) {
      workspace.image = image;
      this.initOldWorkspaces++;
      if (this.initOldWorkspaces < this.workspaces.length) {
        this.selectedWorkspace = this.workspaces[this.initOldWorkspaces];
        setTimeout(() => {
          this.getImageData[this.selectedWorkspace?.id] = true;
        }, 100);
      } else {
        this.initOldWorkspaces = -1;
        this.selectedWorkspace = undefined;
        this.hideWorkspaces = false;
        this.spinner.hide();
      }
    } else {
      this.selectedWorkspace = undefined;
    }
  }

  create() {
    this.router.navigate(['/workspace/new']);
  }

  edit(workspace: IWorkspace) {
    this.router.navigate([`/workspace/${workspace.id}`]);
  }

  async delete(workspace: IWorkspace) {
    this.spinner.show();
    try {
      await this.workspaceService.delete(workspace.id);
      this.workspaces =  this.workspaces.filter(item => item.id !== workspace.id);
      this.spinner.hide();
      if (this.workspaces.length < 3) {
        this.workspaces = [];
        this.workspacesPage = -1;
        this.loadMoreData();
      }
    } catch (error) {
      if (error.error.message === 'Token is not valid') {
        this.spinner.hide();
        this.router.navigate(['/account/login']);
      }
      this.spinner.hide();
    }
  }

}

import { Component, OnInit } from '@angular/core';
import { WorkspaceService } from '../common/services/api/workspace.service';
import { Router } from '@angular/router';
import { IWorkspace } from '../workspace/workspace.component';
import { SVGEnum } from '../common/enums/svg.enum';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public workspaces: IWorkspace[];
  public getImageData = {};
  public selectedWorkspace: IWorkspace;
  public initOldWorkspaces = -1;
  public hideWorkspaces = true;

  public SVGEnum = SVGEnum;

  public JSON = JSON;

  constructor(
    public workspaceService: WorkspaceService,
    public router: Router,
    private spinner: NgxSpinnerService
  ) { }

  async ngOnInit(): Promise<void> {
    this.spinner.show();
    try {
      this.workspaces = await this.workspaceService.getAll();
      if (this.workspaces.length) {
        this.initOldWorkspaces = 0;
        this.selectedWorkspace = this.workspaces[0];
        setTimeout(() => {
          this.getImageData[this.selectedWorkspace.id] = true;
        }, 100);
      }
    } catch (e) {
      this.workspaces = [];
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
          this.getImageData[this.selectedWorkspace.id] = true;
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

}

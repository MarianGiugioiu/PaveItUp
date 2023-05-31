import { Component, OnInit } from '@angular/core';
import { WorkspaceService } from '../common/services/api/workspace.service';
import { Router } from '@angular/router';
import { IWorkspace } from '../workspace/workspace.component';
import { SVGEnum } from '../common/enums/svg.enum';

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

  public SVGEnum = SVGEnum;

  constructor(
    public workspaceService: WorkspaceService,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.workspaces = this.workspaceService.getAll();
    if (this.workspaces.length) {
      this.initOldWorkspaces = 0;
      this.selectedWorkspace = this.workspaces[0];
      this.getImageData[this.selectedWorkspace.id] = true;
    }
  }

  updateGetImageData(workspace, image) {
    if (this.initOldWorkspaces !== -1) {
      workspace.image = image;
      this.initOldWorkspaces++;
      if (this.initOldWorkspaces < this.workspaces.length) {
        this.selectedWorkspace = this.workspaces[this.initOldWorkspaces];
        this.getImageData[this.selectedWorkspace.id] = true;
      } else {
        this.initOldWorkspaces = -1;
        this.selectedWorkspace = undefined;
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

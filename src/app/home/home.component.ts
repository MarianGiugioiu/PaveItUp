import { Component, OnInit } from '@angular/core';
import { WorkspaceService } from '../common/services/api/workspace.service';
import { Router } from '@angular/router';
import { IWorkspace } from '../workspace/workspace.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public workspaces: IWorkspace[];

  constructor(
    public workspaceService: WorkspaceService,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.workspaces = this.workspaceService.getAll();
  }

  create() {
    this.router.navigate(['/workspace/new']);
  }

  edit(workspace: IWorkspace) {
    this.router.navigate([`/workspace/${workspace.id}`]);
  }

}

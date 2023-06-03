import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash';
import { IWorkspace } from 'src/app/workspace/workspace.component';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private workspaces: IWorkspace[] = [];

  constructor() { }

  getAll() {
    return this.workspaces;
  }

  get(id: string) {
    return this.workspaces.find(item => item.id === id);
  }

  add(resource: IWorkspace) {
    this.workspaces.push(cloneDeep(resource));
  }

  update(resource: IWorkspace) {
    this.workspaces = this.workspaces.map(item => {
      if (item.id === resource.id) {
        return cloneDeep(resource);
      }
      return item;
    });
  }
}

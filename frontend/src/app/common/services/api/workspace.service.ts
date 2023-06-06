import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash';
import { IWorkspace } from 'src/app/workspace/workspace.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { LocalStorageService } from '../local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private apiResource = 'http://localhost:3000/workspaces';
  
  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) { }

  getAll(page: number): Promise<any> {
    const token = this.localStorageService.getItem('access_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = this.apiResource;
    const params = new HttpParams().set('page', page);
    return this.http.get(url, { headers, params }).toPromise();
  }

  get(id: string) {
    const token = this.localStorageService.getItem('access_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${this.apiResource}/${id}`;
    return this.http.get(url, { headers }).toPromise();
  }

  add(resource: IWorkspace) {
    const token = this.localStorageService.getItem('access_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = this.apiResource;
    return this.http.post(url, resource, { headers }).toPromise();
  }

  update(resource: IWorkspace) {
    const token = this.localStorageService.getItem('access_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${this.apiResource}/${resource.id}`;
    return this.http.put(url, resource, { headers }).toPromise();
  }
}

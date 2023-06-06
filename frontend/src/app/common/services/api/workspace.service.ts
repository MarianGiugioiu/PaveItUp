import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash';
import { IWorkspace } from 'src/app/workspace/workspace.component';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private apiResource = 'http://localhost:3000/workspaces';
  private token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIxOTEyNDRiLTdjNWQtNDU0NS1iMWE0LThkMGY3YjgyYTU1MyIsIm5hbWUiOiJGcmFjdCIsInVzZXJuYW1lIjoiZnJhY3RnZW4ud29ybGRAZ21haWwuY29tIiwiYXV0aG9yaXR5IjoidXNlciIsImlhdCI6MTY4NjA0ODgwOSwiZXhwIjoxNjg2MDY2ODA5fQ.P3YFHj1OdEbBhKpfJxT3OEVMFsD7_vRxXujhqpa3Q8g';

  constructor(private http: HttpClient) { }

  getAll(page: number): Promise<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
    const url = this.apiResource;
    const params = new HttpParams().set('page', page);
    return this.http.get(url, { headers, params }).toPromise();
  }

  get(id: string) {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
    const url = `${this.apiResource}/${id}`;
    return this.http.get(url, { headers }).toPromise();
  }

  add(resource: IWorkspace) {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
    const url = this.apiResource;
    return this.http.post(url, resource, { headers }).toPromise();
  }

  update(resource: IWorkspace) {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
    const url = `${this.apiResource}/${resource.id}`;
    return this.http.put(url, resource, { headers }).toPromise();
  }
}

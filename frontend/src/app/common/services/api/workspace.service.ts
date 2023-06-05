import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash';
import { IWorkspace } from 'src/app/workspace/workspace.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private apiResource = 'http://localhost:3000/workspaces';
  private workspaces: IWorkspace[] = [];

  constructor(private http: HttpClient) { }

  // getAll() {
  //   return this.workspaces;
  // }

  getAll(): Promise<any> {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIxOTEyNDRiLTdjNWQtNDU0NS1iMWE0LThkMGY3YjgyYTU1MyIsIm5hbWUiOiJGcmFjdCIsInVzZXJuYW1lIjoiZnJhY3RnZW4ud29ybGRAZ21haWwuY29tIiwiYXV0aG9yaXR5IjoidXNlciIsImlhdCI6MTY4NTk3MTU5MSwiZXhwIjoxNjg1OTg5NTkxfQ.wC5umv0XuonPFajnM26OiHCxTcPu_XXWtJcHuCzqh0w'
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = this.apiResource;
    return this.http.get(url, { headers }).toPromise();
  }

  get(id: string) {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIxOTEyNDRiLTdjNWQtNDU0NS1iMWE0LThkMGY3YjgyYTU1MyIsIm5hbWUiOiJGcmFjdCIsInVzZXJuYW1lIjoiZnJhY3RnZW4ud29ybGRAZ21haWwuY29tIiwiYXV0aG9yaXR5IjoidXNlciIsImlhdCI6MTY4NTk3MTU5MSwiZXhwIjoxNjg1OTg5NTkxfQ.wC5umv0XuonPFajnM26OiHCxTcPu_XXWtJcHuCzqh0w'
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${this.apiResource}/${id}`;
    return this.http.get(url, { headers }).toPromise();
  }

  add(resource: IWorkspace) {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIxOTEyNDRiLTdjNWQtNDU0NS1iMWE0LThkMGY3YjgyYTU1MyIsIm5hbWUiOiJGcmFjdCIsInVzZXJuYW1lIjoiZnJhY3RnZW4ud29ybGRAZ21haWwuY29tIiwiYXV0aG9yaXR5IjoidXNlciIsImlhdCI6MTY4NTk3MTU5MSwiZXhwIjoxNjg1OTg5NTkxfQ.wC5umv0XuonPFajnM26OiHCxTcPu_XXWtJcHuCzqh0w'
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = this.apiResource;
    return this.http.post(url, resource, { headers }).toPromise();
  }

  update(resource: IWorkspace) {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIxOTEyNDRiLTdjNWQtNDU0NS1iMWE0LThkMGY3YjgyYTU1MyIsIm5hbWUiOiJGcmFjdCIsInVzZXJuYW1lIjoiZnJhY3RnZW4ud29ybGRAZ21haWwuY29tIiwiYXV0aG9yaXR5IjoidXNlciIsImlhdCI6MTY4NTk3MTU5MSwiZXhwIjoxNjg1OTg5NTkxfQ.wC5umv0XuonPFajnM26OiHCxTcPu_XXWtJcHuCzqh0w'
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${this.apiResource}/${resource.id}`;
    return this.http.put(url, resource, { headers }).toPromise();
  }
}

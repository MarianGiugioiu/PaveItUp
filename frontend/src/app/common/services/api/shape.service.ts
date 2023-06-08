import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { LocalStorageService } from '../local-storage.service';
import { IShape } from 'src/app/generate-line/generate-line.component';

export interface IShapeParams {
  limit: number;
  page: number;
  accountName: string;
  official: number;
  mine: number;
  validated: number;
}

@Injectable({
  providedIn: 'root'
})
export class ShapeService {
  private apiResource = 'http://localhost:3000/shapes';
  
  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) { }

  getAll(queryParams: IShapeParams): Promise<any> {
    const token = this.localStorageService.getItem('access_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = this.apiResource;
    const params = new HttpParams()
      .set('page', queryParams.page)
      .set('limit', queryParams.limit)
      .set('accountName', queryParams.accountName)
      .set('official', queryParams.official)
      .set('mine', queryParams.mine)
      .set('validated', queryParams.validated)
    return this.http.get(url, { headers, params }).toPromise();
  }

  add(resource: IShape) {
    const token = this.localStorageService.getItem('access_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = this.apiResource;
    return this.http.post(url, resource, { headers }).toPromise();
  }

  validate(id: string) {
    const token = this.localStorageService.getItem('access_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${this.apiResource}/validate/${id}`;
    return this.http.patch(url { headers }).toPromise();
  }

  delete(id: string) {
    const token = this.localStorageService.getItem('access_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const url = `${this.apiResource}/${id}`;
    return this.http.delete(url, { headers }).toPromise();
  }
}

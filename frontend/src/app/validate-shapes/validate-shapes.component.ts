import { Component, OnInit } from '@angular/core';
import { WorkspaceService } from '../common/services/api/workspace.service';
import { Router } from '@angular/router';
import { SVGEnum } from '../common/enums/svg.enum';
import { NgxSpinnerService } from 'ngx-spinner';
import { LocalStorageService } from '../common/services/local-storage.service';
import { EventsService } from '../common/services/events.service';
import { EventsEnum } from '../common/enums/events.enum';
import { IShape } from '../generate-line/generate-line.component';
import { IShapeParams, ShapeService } from '../common/services/api/shape.service';
import * as THREE from 'three';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-validate-shapes',
  templateUrl: './validate-shapes.component.html',
  styleUrls: ['./validate-shapes.component.scss']
})
export class ValidateShapesComponent {
  public getImageData = {};
  public selectedImportedShape: IShape;
  public initImportedShapes = -1;
  public shapesPage = 0;
  public importedShapes: IShape[];
  public importedShapesAccountName: string;
  public importedShapesMine: boolean;
  public importedShapesOfficial: boolean;
  public hideWorkspace = true;

  public SVGEnum = SVGEnum;
  private eventSubscription;

  constructor(
    private appComponent: AppComponent,
    public workspaceService: WorkspaceService,
    public router: Router,
    private spinner: NgxSpinnerService,
    private localStorageService: LocalStorageService,
    private eventsService: EventsService,
    private shapeService: ShapeService,
  ) { }

  async ngOnInit() {
    this.eventSubscription = this.eventsService.subscribe(EventsEnum.logout, () => {
      this.router.navigate(['/']);
    });
    const token = this.localStorageService.getItem('access_token');
    if (!token) {
      this.appComponent.logoutToLogin();
      return;
    }
    this.openImportShape();
  }

  ngOnDestroy() {
    this.eventSubscription.unsubscribe();
  }

  updateGetImageDataImportated(importedShape) {
    if (this.initImportedShapes !== -1) {
      this.initImportedShapes++;
      if (this.initImportedShapes < this.importedShapes.length) {
        this.selectedImportedShape = this.importedShapes[this.initImportedShapes];
        setTimeout(() => {
          this.getImageData[this.selectedImportedShape?.id] = true;
        }, 100);
      } else {
        this.initImportedShapes = -1;
        this.selectedImportedShape = undefined;
        this.hideWorkspace = false;
        this.spinner.hide();
      }
    } else {
      this.selectedImportedShape = undefined;
    }
  }

  async validateImportedShape(importedShape: IShape) {
    this.spinner.show();
    try {
      await this.shapeService.validate(importedShape.id);
      this.spinner.hide();
      this.importedShapes =  this.importedShapes.filter(item => item.id !== importedShape.id);
      this.spinner.hide();
      if (this.importedShapes.length < 4) {
        this.importedShapes = [];
        this.shapesPage = -1;
        this.loadMoreData();
      }
    } catch (error) {
      if (error.error.message === 'Token is not valid') {
        this.spinner.hide();
        this.appComponent.logoutToLogin();
      }
      this.spinner.hide();
    }
  }

  filterImportedShapes() {
    let params: IShapeParams = {
      page: 0,
      limit: 4,
      validated: 0,
      accountName: this.importedShapesAccountName,
      mine: this.importedShapesMine ? 1: 0,
      official: this.importedShapesOfficial ? 1 : 0
    };
    this.openImportShape(params);
  }

  async openImportShape(withFilters?: IShapeParams) {
    this.spinner.show();
    this.hideWorkspace = true;
    try {
      let params: IShapeParams;
      if (!withFilters) {
        params = {
          page: 0,
          limit: 4,
          validated: 0,
        };
      } else {
        params = withFilters;
      }
      
      let newShapes = await this.shapeService.getAll(params);
      newShapes = newShapes.map(shape => {
        shape.points = JSON.parse(shape.points);
        shape.points.map(point => {
          point.point = new THREE.Vector2(point.point.x, point.point.y);
          return point;
        });
        return shape;
      }) as IShape;
      this.importedShapes = newShapes;
      
      if (this.importedShapes.length) {
        this.initImportedShapes = 0;
        this.selectedImportedShape = this.importedShapes[this.initImportedShapes];
        setTimeout(() => {
          this.getImageData[this.selectedImportedShape.id] = true;
        }, 100);
      } else {
        this.hideWorkspace = false;
        this.spinner.hide();
      }
    } catch (error) {
      if (error.error.message === 'Token is not valid') {
        this.appComponent.logoutToLogin();
      }
      this.importedShapes = [];
      this.hideWorkspace = false;
      this.spinner.hide();
    }
  }

  async onLastElementInView() {
    await this.loadMoreData();
  }

  async loadMoreData() {
    this.spinner.show();
    this.shapesPage++;
    this.hideWorkspace = true;
    try {
      let params: IShapeParams = {
        page: this.shapesPage,
        limit: 4,
        validated: 0
      };
      let newShapes = await this.shapeService.getAll(params);
      newShapes = newShapes.map(shape => {
        shape.points = JSON.parse(shape.points);
        shape.points.map(point => {
          point.point = new THREE.Vector2(point.point.x, point.point.y);
          return point;
        });
        return shape;
      }) as IShape;
      if (newShapes.length) {
        this.initImportedShapes = this.importedShapes.length;
        this.importedShapes = this.importedShapes.concat(newShapes);
        this.selectedImportedShape = this.importedShapes[this.initImportedShapes];
        setTimeout(() => {
          this.getImageData[this.selectedImportedShape.id] = true;
        }, 100);
      } else {
        this.hideWorkspace = false;
        this.spinner.hide();
      }
    } catch (error) {
      if (error.error.message === 'Token is not valid') {
        this.appComponent.logoutToLogin();
      }
      this.hideWorkspace = false;
      this.spinner.hide();
    }
  }
}

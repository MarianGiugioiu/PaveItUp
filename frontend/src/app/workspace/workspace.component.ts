import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IPoint, IShape } from '../generate-line/generate-line.component';
import * as THREE from 'three';
import { cloneDeep, random } from 'lodash';
import { GeneralService } from '../common/services/general.service';
import { PlaceShapesComponent } from '../place-shapes/place-shapes.component';
import { v4 as uuidv4 } from 'uuid';
import { WorkspaceService } from '../common/services/api/workspace.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { SVGEnum } from '../common/enums/svg.enum';
import { LocalStorageService } from '../common/services/local-storage.service';
import { EventsService } from '../common/services/events.service';
import { EventsEnum } from '../common/enums/events.enum';
import { NgxCaptureService } from 'ngx-capture';
import { saveAs} from 'file-saver';
import { IShapeParams, ShapeService } from '../common/services/api/shape.service';
import { AppComponent } from '../app.component';

export interface IWorkspace {
  cameraRatioSurface?: number;
  cameraRatioShape?: number;
  name?: string;
  id?: string;
  surface?: string,
  parts?: string,
  shapes?: string,
  image?: string;
}

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit {
  @ViewChild('editedSurface') editedSurface: PlaceShapesComponent;
  @ViewChild('screen') screen: any;
  public workspaceId: string;
  public newWorkspaceName: string;
  public workspace: IWorkspace;
  public shapes: IShape[] = [];
  public parts: IShape[] = [];
  public surfaceParts: IShape[] = [];
  public testParts: THREE.Mesh[] = [];
  public surface: IShape;
  public expandedShapeDetails: IShape;
  public selectedPart: IShape;
  public isEditingSurface = true;
  public isGoingToEditSurface = false;
  public isSelectingDimensions = true;
  public cameraRatioSurface;
  public cameraRatioShape;
  public cameraRatioWorkspace;
  public updateFromShape = false;
  public getImageData = {};
  public pendingShape;
  public pendingPart;
  public cycleParts = -1;
  public intersectsExist = false;
  public initOldShapes = -1;
  public initOldParts = -1;

  public error: string;

  public SVGEnum = SVGEnum;
  public authority: string;
  public hideWorkspace = true;
  public workspaceImage: string;
  public previewActive = false;
  public previewDownload = false;
  public isExporting = false;
  public exportAddress = '';
  public exportError = '';
  
  public isImportingShape = false;
  public selectedImportedShape: IShape;
  public initImportedShapes = -1;
  public shapesPage = 0;
  public importedShapes: IShape[];
  public importedShapesAccountName: string;
  public importedShapesMine: boolean;
  public importedShapesOfficial: boolean;

  private eventSubscription;

  constructor(
    private appComponent: AppComponent,
    public generalService: GeneralService,
    public workspaceService: WorkspaceService,
    public router: Router,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private localStorageService: LocalStorageService,
    private eventsService: EventsService,
    private captureService: NgxCaptureService,
    private shapeService: ShapeService,
    ) { }

  async ngOnInit() {
    this.cameraRatioWorkspace = this.cameraRatioSurface / 3;
    this.authority = this.localStorageService.getItem('account_authority');
    this.eventSubscription = this.eventsService.subscribe(EventsEnum.logout, () => {
      this.router.navigate(['/']);
    });

    const token = this.localStorageService.getItem('access_token');
    if (!token) {
      this.appComponent.logoutToLogin();
      return;
    }
    this.spinner.show();
    this.hideWorkspace = true;
    this.workspaceId = this.route.snapshot.paramMap.get('id');
    if (this.workspaceId === 'new') {
      this.newWorkspaceName = 'New Workspace';
      this.hideWorkspace = false;
      this.spinner.hide();
    } else {
      this.isSelectingDimensions = false;
      try {
        this.workspace = await this.workspaceService.get(this.workspaceId);
        if (!this.workspace) {
          this.spinner.hide();
          this.router.navigate(['/']);
        } else {
          this.cameraRatioSurface = this.workspace.cameraRatioSurface;
          this.cameraRatioShape = this.workspace.cameraRatioShape;
          const initSurface: IShape = JSON.parse(this.workspace.surface);
          initSurface.points.map(point => {
            point.point = new THREE.Vector2(point.point.x, point.point.y);
            return point;
          });
          this.surface = initSurface;
  
          const initShapes: IShape[] = JSON.parse(this.workspace.shapes);
          this.shapes = initShapes.map(shape => {
            shape.points.map(point => {
              point.point = new THREE.Vector2(point.point.x, point.point.y);
              return point;
            });
            return shape;
          });
  
          const initParts: IShape[] = JSON.parse(this.workspace.parts);
          initParts.reverse();
          this.parts = initParts.map(part => {
            part.points.map(point => {
              point.point = new THREE.Vector2(point.point.x, point.point.y);
              return point;
            });
            return part;
          });
          
          this.surfaceParts = this.parts;
          this.isEditingSurface = false;
  
          if (this.shapes.length) {
            this.initOldShapes = 0;
            this.expandedShapeDetails = this.shapes[this.initOldShapes];
            this.getImageData[this.expandedShapeDetails.id] = true;
          } else {
            this.hideWorkspace = false;
            this.spinner.hide();
          }
        }
      } catch (error) {
        if (error.error.message === 'Token is not valid') {
          this.spinner.hide();
          this.appComponent.logoutToLogin();
        }
        this.hideWorkspace = false;
        this.spinner.hide();
        this.router.navigate(['/']);
      }
    }
  }

  ngOnDestroy() {
    this.eventSubscription.unsubscribe();
  }

  saveDimensions() {
    if (!this.cameraRatioShape || !this.cameraRatioSurface || this.cameraRatioShape < 5 || this.cameraRatioShape > 200 || this.cameraRatioSurface < 50 || this.cameraRatioSurface > 10000) {
      this.error = 'Dimensions are invalid. Check values info.';
    } else {
      this.cameraRatioWorkspace = this.cameraRatioSurface / 3;
      this.spinner.show();
      this.hideWorkspace = true;
      this.isSelectingDimensions = false;
      this.createSurface();
      this.hideWorkspace = false;
      this.spinner.hide();
    }
  }

  clearError() {
    this.error = undefined;
  }

  checkIntersect(event) {
    this.intersectsExist = event;
  }

  updateGetImageDataWorkspace(image) {
    this.workspaceImage = image;
    this.getImageData['-1'] = false;
    this.previewActive = true;
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

  updateGetImageData(shape) {
    this.getImageData[shape.partId ? shape.partId : shape.id] = false;
    if (this.isGoingToEditSurface) {
      this.selectedPart = undefined;
      this.isGoingToEditSurface = false;
      this.isEditingSurface = true;
      this.expandedShapeDetails = undefined;
    }
    if (shape.partId) {
      if (this.pendingPart) {
        // When another part is clicked
        this.selectedPart = this.pendingPart;
        this.pendingPart = undefined;
      } else if (this.cycleParts !== -1) {
        //When a shape is changed and the corresponding parts need to be changed
        this.cycleParts++;
        const index = this.findNextPartIndexInList(shape.id, this.cycleParts);
        if (index !== -1) {
          this.selectedPart = this.parts[index];
          this.getImageData[this.parts[index].partId] = true;
        } else {
          this.cycleParts = -1;
          this.selectedPart = undefined;
        }
      } else if (this.initOldParts !== -1) {
        // When the workspace is recreated
        this.initOldParts++;
        if (this.initOldParts < this.parts.length) {
          this.selectedPart = this.parts[this.initOldParts];
          this.getImageData[this.selectedPart.partId] = true;
        } else {
          this.initOldParts = -1;
          this.selectedPart = undefined;
          this.hideWorkspace = false;
          this.spinner.hide();
        }
      } else {
        this.selectedPart = undefined;
      }
    } else {
      if (this.initOldShapes !== -1) {
        // When the workspace is recreated
        this.initOldShapes++;
        if (this.initOldShapes < this.shapes.length) {
          this.expandedShapeDetails = this.shapes[this.initOldShapes];
          this.getImageData[this.expandedShapeDetails.id] = true;
        } else {
          this.initOldShapes = -1;
          this.expandedShapeDetails = undefined;
          if (this.parts.length) {
            this.initOldParts = 0;
            this.selectedPart = this.parts[this.initOldParts];
            this.getImageData[this.selectedPart.partId] = true;
          } else {
            this.hideWorkspace = false;
            this.spinner.hide();
          }
        }
      } else {
        this.expandedShapeDetails = undefined;
      }
    }
  }

  openExport() {
    this.isExporting = true;
  }

  selectImportedShape(importedShape: IShape) {
    importedShape.imported = true;
    this.importedShapesAccountName = undefined;
    this.importedShapesMine = false;
    this.importedShapesOfficial = false;
    this.shapes.unshift(importedShape);
    this.isImportingShape = false;
  }

  filterImportedShapes() {
    let params: IShapeParams = {
      page: 0,
      limit: 4,
      accountName: this.importedShapesAccountName,
      mine: this.importedShapesMine ? 1: 0,
      official: this.importedShapesOfficial ? 1 : 0
    };
    this.openImportShape(params);
  }

  async openImportShape(withFilters?: IShapeParams) {
    if (this.isImportingShape && !withFilters) {
      this.isImportingShape = false;
      return;
    }
    this.isImportingShape = true;
    this.spinner.show();
    this.hideWorkspace = true;
    try {
      let params: IShapeParams;
      if (!withFilters) {
        params = {
          page: 0,
          limit: 4
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
        limit: 4
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

  async export() {
    if (this.checkWorkspaceName(this.workspace.name)) {
      this.spinner.show();
      try {
        await this.workspaceService.export({username: this.exportAddress}, this.workspace.id);
        this.exportAddress = '';
        this.isExporting = false;
        this.spinner.hide();
        this.router.navigate(['/workspaces']);
      } catch (error) {
        if (error.error.message === 'Token is not valid') {
          this.spinner.hide();
          this.appComponent.logoutToLogin();
        } else if (error.status === 404) {
          this.exportError = 'Account not found';
        }
        this.spinner.hide();
      }
    }
  }

  goToPreview() {
    this.getImageData['-1'] = true;
  }

  exitPreview() {
    this.previewActive = false;
  }

  createNewPoints() {
    return [
      {
        point: new THREE.Vector2(-0.5 * this.cameraRatioShape, -0.5 * this.cameraRatioShape),
        type: 'line'
      },
      {
        point: new THREE.Vector2(-0.5 * this.cameraRatioShape, 0.5 * this.cameraRatioShape),
        type: 'line'
      },
      {
        point: new THREE.Vector2(0.5 * this.cameraRatioShape, 0.5 * this.cameraRatioShape),
        type: 'line'
      },
      {
        point: new THREE.Vector2(0.5 * this.cameraRatioShape, -0.5 * this.cameraRatioShape),
        type: 'line'
      }
    ];
  }

  copyPoints(shape: IShape) {
    const pointsCopy = [];
    shape.points.forEach(item => {
      pointsCopy.push({
        point: item.point,
        type: item.type
      });
    });
    return pointsCopy;
  }

  addNewShape(shape: IShape = undefined) {
    if (!this.expandedShapeDetails && this.shapes.length < 20) {
      const id = uuidv4();
      const nameId = this.createNewId('Shape');
      const name = this.createNewName('Shape', nameId);
      this.shapes.unshift(
        {
          id,
          name,
          textureType: shape ? shape.textureType : 0,
          color: shape ? shape.color : undefined,
          points: shape ? this.copyPoints(shape) : this.createNewPoints()
        }
      );
      
      this.expandedShapeDetails = this.shapes[0];

      if (this.selectedPart) {
        this.getImageData[this.selectedPart.partId] = true;
      }
    } 
  }

  duplicateShape(shape: IShape) {
    this.addNewShape(shape);
  }

  async exportShape(shape) {
    const shapeToExport = this.mapShapeToPart(shape) as any;
    shapeToExport.cameraRatioShape = this.cameraRatioShape;
    shapeToExport.points = JSON.stringify(shapeToExport.points);
    shapeToExport.id = uuidv4();

    this.spinner.show();
    try {
      await this.shapeService.add(shapeToExport);
      this.spinner.hide();
    } catch (error) {
      if (error.error.message === 'Token is not valid') {
        this.spinner.hide();
        this.appComponent.logoutToLogin();
      }
      this.spinner.hide();
    }
  }

  createSurface() {
    this.surface = {
      id: '0',
      name: 'Surface',
      textureType: 0,
      points:[
        {
          point: new THREE.Vector2(-0.5 * this.cameraRatioSurface, -0.5 * this.cameraRatioSurface),
          type: 'line'
        },
        {
          point: new THREE.Vector2(-0.5 * this.cameraRatioSurface, 0.5 * this.cameraRatioSurface),
          type: 'line'
        },
        {
          point: new THREE.Vector2(0.5 * this.cameraRatioSurface, 0.5 * this.cameraRatioSurface),
          type: 'line'
        },
        {
          point: new THREE.Vector2(0.5 * this.cameraRatioSurface, -0.5 * this.cameraRatioSurface),
          type: 'line'
        }
      ]
    }
  }

  openShapeDetails(shape: IShape) {
    if (!this.expandedShapeDetails) {
      this.expandedShapeDetails = shape;
      if (this.selectedPart) {
        this.getImageData[this.selectedPart.partId] = true;
      }
    }
  }

  toggleSelectPart(part: IShape) {
    if (this.selectedPart?.partId === part.partId) {
      this.getImageData[this.selectedPart.partId] = true;
    } else {
      if (!this.expandedShapeDetails) {
        if (this.selectedPart) {
          this.pendingPart = part;
          this.getImageData[this.selectedPart.partId] = true;
        } else {
          this.selectedPart = part;
        }
      }
    }
  }

  updateShapeMinimization(event, shape: IShape) {
    this.selectedPart = undefined;
    if (event === true) {
      if (shape.id === '0') {
        this.isEditingSurface = false;
      } else {
        this.expandedShapeDetails = undefined;
        this.parts = this.parts.map((item) => {
          const partId = item.partId;
          const partName = item.name;
          const rotation = item.rotation;
          if (item.id === shape.id) {
            item = this.mapShapeToPart(shape);
            item.name = partName;
            item.partId = partId;
            item.rotation = rotation;
            this.rotatePart(item, -rotation);
          }
          return item;
        });
        if (this.parts.length) {
          this.cycleParts = 0;
          const index = this.findNextPartIndexInList(shape.id, this.cycleParts);
          if (index !== -1) {
            this.selectedPart = this.parts[index];
            this.getImageData[this.parts[index].partId] = true;
          }
        }
        this.updateFromShape = true;
        this.generateSurfaceParts();
      }
    } else {
      this.expandedShapeDetails = shape;
    }
  }

  findNextPartIndexInList(id, index) {
    let count = -1;
    for (let i = 0; i < this.parts.length; i++) {
      if (this.parts[i].id === id) {
        count++;
      }
      if (count === index) {
        return i;
      }
    }
    return -1;
  }

  rotatePart(part: IShape, value: number) {
    const rotationMatrix = new THREE.Matrix4().makeRotationZ(value);
    
    part.points.map((item, index) => {
      let newPos = new THREE.Vector3(item.point.x, item.point.y, 0);
      newPos.applyMatrix4(rotationMatrix);
      part.points[index].point = new THREE.Vector2(newPos.x, newPos.y);
    });
  }

  openSurfaceEdit() {
    if (!this.expandedShapeDetails) {
      this.editedSurface.ngOnDistroy();
      if (this.selectedPart) {
        this.isGoingToEditSurface = true;
        this.getImageData[this.selectedPart.partId] = true;
      }
      if (!this.selectedPart) {
        this.isEditingSurface = true;
      }
    }
  }

  useShape(shape: IShape) {
    let part = this.mapShapeToPart(shape);
    part.rotation = 0;
    part.partId = uuidv4();
    const nameId = this.createNewId('Part');
    part.name = this.createNewName('Part', nameId);
    
    this.parts.unshift(part);
    this.updateFromShape = false;
    this.generateSurfaceParts();
    if (this.selectedPart) {
      this.pendingPart = part;
      this.getImageData[this.selectedPart.partId] = true;
    } else {
      this.selectedPart = part;
    }
  }

  deleteShape(i: number) {
    this.parts = this.parts.filter(item => item.id !== this.shapes[i].id);
    this.shapes.splice(i, 1);
    this.generateSurfaceParts();
  }

  deletePart(i: number) {
    if (this.selectedPart?.partId === this.parts[i].partId) {
      this.selectedPart = undefined;
    }
    this.parts.splice(i, 1);
    this.generateSurfaceParts();
  }

  choosePartFromSurface(event: string) {
    let part = this.parts.find(item => item.partId === event);
    if (this.selectedPart) {
      if (part.partId !== this.selectedPart.partId) {
        this.pendingPart = part;
        this.getImageData[this.selectedPart.partId] = true;
      }
    } else {
      this.selectedPart = part;
    }
  }

  getBiggestNameId() {
    let max = 1;
    this.shapes.forEach(item => {
      let name = +item.name.replace('Shape_', '');
      if (!isNaN(name) && name > max) {
        max = name;
      }
    });
    return max;
  }

  createNewId(type) {
    let id = 1;
    if (type === 'Part') {
      if (this.parts.length) {
        id = +this.parts[0].name.replace('Part_', '') + 1;
      }
    } else {
      if (this.shapes.length) {
        id = this.getBiggestNameId() + 1;
      }
    }
    return id;
  }

  createNewName(type, id) {
    return type + '_' + id;
  }

  updatePartRotation() {
    this.updateFromShape = false;
    this.generateSurfaceParts();
  }

  generateSurfaceParts() {
    let positions = {};
    this.surfaceParts.forEach(item => positions[item.partId] = item.position);
    
    this.surfaceParts = [];
    this.parts.forEach(part => {
      this.surfaceParts.push({
        partId: part.partId,
        id: part.id,
        name: part.name,
        textureType: part.textureType,
        color: part.color,
        points: cloneDeep(part.points),
        position: positions[part.partId],
        rotation: part.rotation
      });
    })
  };

  mapShapeToPart(shape: IShape) {
    let points: IPoint[] = shape.points.map(item => {
      return {
        type: item.type,
        point: new THREE.Vector2(item.point.x, item.point.y)
      }
    });
    let part: IShape = {
      id: shape.id,
      name: shape.name,
      textureType: shape.textureType,
      color: shape.color,
      points,
      imported: shape.imported
    }
    return part;
  }

  checkWorkspaceName(name: string) {
    if (name.length < 3 || name.length > 50) {
      return false;
    }
    return true;
  }
  
  async saveWorkspace() {
    if (!this.intersectsExist) {
      let newShapes = [];
      this.shapes.forEach(item => {
        newShapes.push(this.mapShapeToPart(item));
      });
      
      const workspace: IWorkspace = {
        name: this.workspaceId === 'new' ? this.newWorkspaceName : this.workspace.name,
        cameraRatioSurface: this.cameraRatioSurface,
        cameraRatioShape: this.cameraRatioShape,
        id: this.workspaceId === 'new' ? uuidv4() : this.workspaceId,
        surface: JSON.stringify(this.mapShapeToPart(this.surface)),
        parts: JSON.stringify(this.surfaceParts.reverse()),
        shapes: JSON.stringify(newShapes)
      };

      this.surfaceParts.reverse();
      
      if (this.checkWorkspaceName(workspace.name)) {
        if (this.workspaceId === 'new') {
          this.spinner.show();
          try {
            await this.workspaceService.add(workspace);
            this.spinner.hide();
          } catch (error) {
            if (error.error.message === 'Token is not valid') {
              this.spinner.hide();
              this.appComponent.logoutToLogin();
            }
            this.spinner.hide();
          }
        } else {
          this.spinner.show();
          try {
            await this.workspaceService.update(workspace);
            this.spinner.hide();
          } catch (error) {
            if (error.error.message === 'Token is not valid') {
              this.spinner.hide();
              this.appComponent.logoutToLogin();
            }
            this.spinner.hide();
          }
        }
        this.router.navigate(['/workspaces']);
      }
    }
  }

  calculateNumberOfParts(shape: IShape) {
    return this.parts.filter(item => item.id === shape.id).length;
  }

  download() {
    this.previewDownload = true;
    setTimeout(() => {
      this.captureService.getImage(this.screen.nativeElement, true).subscribe(img=>{
        saveAs(img, `${this.workspaceId === 'new' ? this.newWorkspaceName : this.workspace.name}.png`)
        this.previewDownload = false;
      });
    }, 100);
  }
}

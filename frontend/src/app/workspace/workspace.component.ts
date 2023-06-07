import { Component, OnInit, ViewChild } from '@angular/core';
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

export interface IWorkspace {
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
  public cameraRatio = 12; //Modificare suprafata
  public updateFromShape = false;
  public getImageData = {};
  public pendingShape;
  public pendingPart;
  public cycleParts = -1;
  public intersectsExist = false;
  public initOldShapes = -1;
  public initOldParts = -1;

  public SVGEnum = SVGEnum;
  public hideWorkspace = true;

  private eventSubscription;

  constructor(
    public generalService: GeneralService,
    public workspaceService: WorkspaceService,
    public router: Router,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private localStorageService: LocalStorageService,
    private eventsService: EventsService,
    ) { }

  async ngOnInit() {
    this.eventSubscription = this.eventsService.subscribe(EventsEnum.logout, () => {
      this.router.navigate(['/']);
    });

    const token = this.localStorageService.getItem('access_token');
    if (!token) {
      this.router.navigate(['/account/login']);
      return;
    }
    this.spinner.show();
    this.hideWorkspace = true;
    this.workspaceId = this.route.snapshot.paramMap.get('id');
    if (this.workspaceId === 'new') {
      this.newWorkspaceName = 'New Workspace';
      this.createSurface();
      this.hideWorkspace = false;
      this.spinner.hide();
    } else {
      try {
        this.workspace = await this.workspaceService.get(this.workspaceId);
        if (!this.workspace) {
          this.spinner.hide();
          this.router.navigate(['/']);
        } else {
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
          this.router.navigate(['/account/login']);
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

  checkIntersect(event) {
    this.intersectsExist = event;
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

  createNewPoints() {
    return [
      {
        point: new THREE.Vector2(-0.5, -0.5),
        type: 'line'
      },
      {
        point: new THREE.Vector2(-0.5, 0.5),
        type: 'line'
      },
      {
        point: new THREE.Vector2(0.5, 0.5),
        type: 'line'
      },
      {
        point: new THREE.Vector2(0.5, -0.5),
        type: 'line'
      }
    ]
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
    if (!this.expandedShapeDetails) {
      const id = uuidv4();
      const nameId = this.createNewId('Shape');
      const name = this.createNewName('Shape', nameId);
      this.shapes.unshift(
        {
          id,
          name,
          textureType: 0,
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

  exportShape(shape) {
    const shapeToExport = this.mapShapeToPart(shape);
  }

  createSurface() {
    this.surface = {
      id: '0',
      name: 'Surface',
      textureType: 0,
      points:[
        {
          point: new THREE.Vector2(-0.5 * this.cameraRatio, -0.5 * this.cameraRatio),
          type: 'line'
        },
        {
          point: new THREE.Vector2(-0.5 * this.cameraRatio, 0.5 * this.cameraRatio),
          type: 'line'
        },
        {
          point: new THREE.Vector2(0.5 * this.cameraRatio, 0.5 * this.cameraRatio),
          type: 'line'
        },
        {
          point: new THREE.Vector2(0.5 * this.cameraRatio, -0.5 * this.cameraRatio),
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
        //todo:Check when shape was rotated but not saved before opening surface edit
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
      points
    }
    return part;
  }
  
  async saveWorkspace() {
    if (!this.intersectsExist) {
      let newShapes = [];
      this.shapes.forEach(item => {
        newShapes.push(this.mapShapeToPart(item));
      });
      
      const workspace: IWorkspace = {
        name: this.workspaceId === 'new' ? this.newWorkspaceName : this.workspace.name,
        id: this.workspaceId === 'new' ? uuidv4() : this.workspaceId,
        surface: JSON.stringify(this.mapShapeToPart(this.surface)),
        parts: JSON.stringify(this.surfaceParts.reverse()),
        shapes: JSON.stringify(newShapes)
      };
      
      if (this.workspaceId === 'new') {
        this.spinner.show();
        try {
          await this.workspaceService.add(workspace);
          this.spinner.hide();
        } catch (error) {
          if (error.error.message === 'Token is not valid') {
            this.spinner.hide();
            this.router.navigate(['/account/login']);
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
            this.router.navigate(['/account/login']);
          }
          this.spinner.hide();
        }
      }
      this.router.navigate(['/workspaces']);
    }
  }
}

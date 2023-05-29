import { Component, OnInit, ViewChild } from '@angular/core';
import { IPoint, IShape } from '../generate-line/generate-line.component';
import * as THREE from 'three';
import { cloneDeep, random } from 'lodash';
import { GeneralService } from '../common/services/general.service';
import { EventsService } from '../common/services/events.service';
import { PlaceShapesComponent } from '../place-shapes/place-shapes.component';
import { v4 as uuidv4 } from 'uuid';
import { WorkspaceService } from '../common/services/api/workspace.service';
import { ActivatedRoute, Router } from '@angular/router';

export interface IWorkspace {
  name?: string;
  id?: string;
  surface?: IShape,
  parts?: IShape[],
  shapes?: IShape[]
}

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit {
  @ViewChild('editedSurface') editedSurface: PlaceShapesComponent;
  public workspaceId: string;
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

  public initOldShapes = -1;
  public initOldParts = -1;

  constructor(
    public generalService: GeneralService,
    public evensService: EventsService,
    public workspaceService: WorkspaceService,
    public router: Router,
    private route: ActivatedRoute
    ) { }

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.paramMap.get('id');
    if (this.workspaceId === 'new') {
      this.createSurface();
    } else {
      this.workspace = this.workspaceService.get(this.workspaceId);
      if (!this.workspace) {
        this.router.navigate(['/']);
      } else {
        this.surface = this.workspace.surface;
        this.shapes = this.workspace.shapes;
        this.parts = this.workspace.parts;
        this.surfaceParts = this.workspace.parts;
        this.isEditingSurface = false;

        if (this.shapes.length) {
          this.initOldShapes = 0;
          this.expandedShapeDetails = this.shapes[this.initOldShapes];
          this.getImageData[this.expandedShapeDetails.name] = true;
        }
      }
    }
  }

  updateGetImageData(shape) {
    // Go to edit surface
    this.getImageData[shape.name] = false;
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
          this.getImageData[this.parts[index].name] = true;
        } else {
          this.cycleParts = -1;
          this.selectedPart = undefined;
        }
      } else if (this.initOldParts !== -1) {
        // When the workspace is recreated
        this.initOldParts++;
        if (this.initOldParts < this.parts.length) {
          this.selectedPart = this.parts[this.initOldParts];
          this.getImageData[this.selectedPart.name] = true;
        } else {
          this.initOldParts = -1;
          this.selectedPart = undefined;
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
          this.getImageData[this.expandedShapeDetails.name] = true;
        } else {
          this.initOldShapes = -1;
          this.expandedShapeDetails = undefined;
          if (this.parts.length) {
            this.initOldParts = 0;
            this.selectedPart = this.parts[this.initOldParts];
            this.getImageData[this.selectedPart.name] = true;
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
      const id = this.createNewId('Shape');
      const name = this.createNewName('Shape', id);
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
        this.getImageData[this.selectedPart.name] = true;
      }
    } 
  }

  duplicateShape(shape: IShape) {
    this.addNewShape(shape);
  }

  createSurface() {
    this.surface = {
      id: 0,
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
        this.getImageData[this.selectedPart.name] = true;
      }
    }
  }

  toggleSelectPart(part: IShape) {
    if (this.selectedPart?.partId === part.partId) {
      this.getImageData[this.selectedPart.name] = true;
    } else {
      if (!this.expandedShapeDetails) {
        if (this.selectedPart) {
          this.pendingPart = part;
          this.getImageData[this.selectedPart.name] = true;
        } else {
          this.selectedPart = part;
        }
      }
    }
  }

  updateShapeMinimization(event, shape: IShape) {
    this.selectedPart = undefined;
    if (event === true) {
      if (shape.id === 0) {
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
            this.getImageData[this.parts[index].name] = true;
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
        this.getImageData[this.selectedPart.name] = true;
      }
      if (!this.selectedPart) {
        this.isEditingSurface = true;
      }
    }
  }

  mapShapeToPart(shape: IShape) {
    let points: IPoint[] = shape.points.map(item => {
      return {
        name: item.name,
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

  useShape(shape: IShape) {
    let part = this.mapShapeToPart(shape);
    part.rotation = 0;
    part.partId = this.createNewId('Part');
    part.name = this.createNewName('Part', part.partId);
    this.parts.unshift(part);
    this.updateFromShape = false;
    this.generateSurfaceParts();
    if (this.selectedPart) {
      this.pendingPart = part;
      this.getImageData[this.selectedPart.name] = true;
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
    if (this.selectedPart?.name === this.parts[i].name) {
      this.selectedPart = undefined;
    }
    this.parts.splice(i, 1);
    this.generateSurfaceParts();
  }

  choosePartFromSurface(event: number) {
    let part = this.parts.find(item => item.partId === event);
    if (this.selectedPart) {
      if (part.name !== this.selectedPart.name) {
        this.pendingPart = part;
        this.getImageData[this.selectedPart.name] = true;
      }
    } else {
      this.selectedPart = part;
    }
  }

  createNewId(type) {
    let id = 1;
    if (type === 'Part') {
      if (this.parts.length) {
        id = this.parts[0].partId + 1;
      }
    } else {
      if (this.shapes.length) {
        id = this.shapes[0].id + 1;
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
    this.surfaceParts.forEach(item => positions[item.name] = item.position);
    
    this.surfaceParts = [];
    this.parts.forEach(part => {
      this.surfaceParts.push({
        partId: part.partId,
        id: part.id,
        name: part.name,
        textureType: part.textureType,
        color: part.color,
        points: cloneDeep(part.points),
        position: positions[part.name],
        rotation: part.rotation
      });
    })
  };
  
  saveWorkspace() {
    let newShapes = [];
    this.shapes.forEach(item => {
      newShapes.push(this.mapShapeToPart(item));
    })
    const workspace: IWorkspace = {
      name: this.workspaceId === 'new' ? 'New Workspace' : this.workspace.name,
      id: this.workspaceId === 'new' ? uuidv4() : this.workspaceId,
      surface: this.mapShapeToPart(this.surface),
      parts: this.surfaceParts,
      shapes: newShapes
    };
    if (this.workspaceId === 'new') {
      this.workspaceService.add(workspace);
    } else {
      this.workspaceService.update(workspace);
    }
    this.router.navigate(['/']);
  }
}

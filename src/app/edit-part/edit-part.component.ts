import { Component, ElementRef, Input, OnInit, Output, ViewChild, EventEmitter, SimpleChanges } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { GeometryService } from '../common/services/geometry.service';
import { cloneDeep, isEqual } from 'lodash';
import { EventsService } from '../common/services/events.service';
import { EventsEnum } from '../common/enums/events.enum';
import { IPoint, IShape } from '../generate-line/generate-line.component';
import { TextureService } from '../common/services/texture.service';

@Component({
  selector: 'app-edit-part',
  templateUrl: './edit-part.component.html',
  styleUrls: ['./edit-part.component.scss']
})
export class EditPartComponent implements OnInit {
  @ViewChild('canvas') private canvasRef: ElementRef;
  private get canvas(): HTMLCanvasElement {
    return this.canvasRef?.nativeElement;
  }

  @Input() shape: IShape;
  @Input() isCanvasMinimized;
  @Input() canDoActions;
  @Input() canRotate;
  @Input() isSurface;
  @Input() getImageData;
  @Output() updateMinimizationEvent = new EventEmitter();
  @Output() updatePartRotationEvent = new EventEmitter();
  @Output() updateGetImageDataEvent = new EventEmitter();
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private controls: OrbitControls;
  private ambientLight: THREE.AmbientLight;
  private canvasWidth = 300;
  private canvasHeight = 300;
  private dragging = false;
  public selectedObject: THREE.Mesh;
  public selectedAdjacentObject: THREE.Mesh;
  private font;
  private textOffset = new THREE.Vector2(-0.06, -0.07);
  public pressedKeys = [];
  public vertexVisibility = true;
  public mainObjectRotation = Math.PI / 45;
  public regularPolygonEdgesNumber: number = 4;
  public cameraRatio = 1;
  initialIteration: IPoint[];
  previousIterations: IPoint[][];
  maxPreviousIterationsNumber = 50;
  currentShapeDuringPointMove: IPoint[];

  getImageData1 = false;

  currentHeight;
  currentBh;
  mainObject: THREE.Mesh;
  heightPoint: THREE.Vector2;

  widthRatio: number;
  heightRatio: number;

  addKey = '1';
  subtractKey = '2';

  value: number = 0;
  public isKeyPressed = false;
  sign = -1;


  textureLoader: THREE.TextureLoader;
  fontLoader: FontLoader

  onMouseDownListener: EventListener;
  onMouseUpListener: EventListener;
  onMouseMoveListener: EventListener;
  onKeyDownListener: EventListener;
  onKeyUpListener: EventListener;

  constructor(
    public geometryService: GeometryService,
    public eventsService: EventsService,
    public textureService: TextureService
  ) { }

  ngOnInit(): void {
    this.textureLoader = new THREE.TextureLoader();
    this.fontLoader = new FontLoader();
  }

  ngOnDistroy() {
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }

  async ngAfterViewInit() {
    this.canvasWidth = 150;
    this.canvasHeight = 150;
    let ratio = 2;
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;

    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
    this.renderer.shadowMap.enabled = true;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    this.camera = new THREE.OrthographicCamera(
      this.canvasWidth / -200 * ratio,
      this.canvasWidth / 200 * ratio,
      this.canvasHeight / 200 * ratio,
      this.canvasHeight / -200 * ratio,
      1,
      1000
    );
    this.camera.position.set(0, 0, 10);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false;
    this.controls.update();

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.font = await this.fontLoader.loadAsync("assets/fonts/Roboto Medium_Regular.json");
    
    this.previousIterations = [];
    this.createPrimaryShape();
    

    this.initialIteration = cloneDeep(this.shape.points);

    if (!this.shape.wasInitialized) {
      this.shape.rotation = 0;
    }

    this.onKeyDownListener = this.onKeyDown.bind(this);
    this.onKeyUpListener = this.onKeyUp.bind(this);
    
    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
      this.controls.update();
      if (this.getImageData) {
        this.getImageData1 = true;
        this.getImageData = false;
      } else {
        if (this.getImageData1) {
          this.getImageData1 = false;
          this.shape.image = this.renderer.domElement.toDataURL("image/png");
          
          document.removeEventListener('keydown', this.onKeyDownListener);
          document.removeEventListener('keyup', this.onKeyUpListener);

          this.renderer.dispose()
          this.renderer.forceContextLoss();
          this.updateGetImageDataEvent.emit();
        }
      }
    });

    document.addEventListener('keydown', this.onKeyDownListener);
    document.addEventListener('keyup', this.onKeyUpListener);

    this.shape.wasInitialized = true;
  }

  toggleMinimize() {
    this.isCanvasMinimized = !this.isCanvasMinimized;
    if(this.shape.id === 0) {
      this.canDoActions = !this.canDoActions;
    }
    this.updateMinimizationEvent.emit(this.isCanvasMinimized);
  }

  

  rotateMainObject(sign) {
    const rotationMatrix = new THREE.Matrix4().makeRotationZ(sign * this.mainObjectRotation);
    this.shape.rotation -= sign * this.mainObjectRotation;
    
    this.mainObject.geometry.applyMatrix4(rotationMatrix);
    
    this.shape.points.map((item, index) => {
      let newPos = new THREE.Vector3(item.point.x, item.point.y, 0);
      newPos.applyMatrix4(rotationMatrix);
      this.shape.points[index].point = new THREE.Vector2(newPos.x, newPos.y);
    });
    this.updatePartRotationEvent.emit();
  }

  rotateMainObjectWithValue(value) {
    const rotationMatrix = new THREE.Matrix4().makeRotationZ(value);
    this.mainObject.geometry.applyMatrix4(rotationMatrix);
    
    this.shape.points.map((item, index) => {
      item.object.position.applyMatrix4(rotationMatrix);
      this.shape.points[index].point = new THREE.Vector2(item.object.position.x, item.object.position.y);
      item.text.position.set(item.object.position.x + this.textOffset.x, item.object.position.y + this.textOffset.y, 0);
    });
  }

  changeColor() {
    const newColor = new THREE.Color(this.shape.color);
    this.mainObject.material.color = newColor;
  }

  createPrimaryShape() {
    this.drawMainObject();
    this.changeColor();
    
    if (this.selectedObject) {
      this.selectedObject = this.shape.points.find(item => item.object.name === this.selectedObject.name)?.object;
    }
    if (this.selectedAdjacentObject) {
      this.selectedAdjacentObject = this.shape.points.find(item => item.object.name === this.selectedAdjacentObject.name)?.object;
    }
  }

  createShape() {
    const shapeGeometry = new THREE.Shape();
    const lastPos = this.shape.points.length - 1;
    shapeGeometry.moveTo(this.shape.points[0].point.x, this.shape.points[0].point.y);

    for (let i = 1; i < this.shape.points.length; i++) {
      
      if (this.shape.points[i].type === 'line') {
        shapeGeometry.lineTo(this.shape.points[i].point.x, this.shape.points[i].point.y);
      } else {
        let cp;
        if (i === lastPos) {
          cp = this.geometryService.getCurveControlPoint(new THREE.Vector2(this.shape.points[i].point.x, this.shape.points[i].point.y), new THREE.Vector2(this.shape.points[i-1].point.x, this.shape.points[i-1].point.y), new THREE.Vector2(this.shape.points[0].point.x, this.shape.points[0].point.y));
          shapeGeometry.quadraticCurveTo(cp.x, cp.y, this.shape.points[0].point.x, this.shape.points[0].point.y);
        } else {
          let cp;
          if (i > 0) {
            cp = this.geometryService.getCurveControlPoint(new THREE.Vector2(this.shape.points[i].point.x, this.shape.points[i].point.y), new THREE.Vector2(this.shape.points[i-1].point.x, this.shape.points[i-1].point.y), new THREE.Vector2(this.shape.points[i+1].point.x, this.shape.points[i+1].point.y));
          } else {
            cp = this.geometryService.getCurveControlPoint(new THREE.Vector2(this.shape.points[lastPos].point.x, this.shape.points[lastPos].point.y), new THREE.Vector2(this.shape.points[i-1].point.x, this.shape.points[i-1].point.y), new THREE.Vector2(this.shape.points[i+1].point.x, this.shape.points[i+1].point.y));
          }
          shapeGeometry.quadraticCurveTo(cp.x, cp.y, this.shape.points[i + 1].point.x, this.shape.points[i + 1].point.y);
          i++;
        }
      }
    }

    shapeGeometry.closePath();
    
    return new THREE.ShapeGeometry(shapeGeometry);
  }




  drawMainObject() {
    const texture = this.textureService.textures.shape[this.shape.textureType];
    const material = new THREE.MeshBasicMaterial({ map: texture });
    material.map.repeat.set(0.25 / this.cameraRatio, 0.25 / this.cameraRatio);
    material.map.offset.set(0.5, 0.5);
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.wrapT = THREE.RepeatWrapping;
    this.mainObject = new THREE.Mesh(this.createShape(), material);
    this.mainObject.name = this.shape.name;
    const isValidShape = this.geometryService.doesPolygonHaveIntersectingEdges(this.shape.points.map(item => item.point));

    if (!isValidShape) {
      if (!this.mainObject.visible) {
        this.mainObject.visible = true;
      }
    } else {
      if (this.mainObject.visible) {
        this.mainObject.visible = false;
      }
    }
    
    this.scene.add(this.mainObject);
  }

  

  onKeyUp(event: KeyboardEvent) {
    if (event.key === this.addKey || event.key === this.subtractKey) {
      this.isKeyPressed = false;
    }
    const index = this.pressedKeys.indexOf(event.key);
    this.pressedKeys.splice(index, 1);
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.pressedKeys.includes(event.key) && (this.canDoActions || this.canRotate)) {
      this.pressedKeys.push(event.key);
    }
    if(this.shape.id !== 0) {

    }

    if (this.canDoActions || this.canRotate) {
      if (this.pressedKeys.includes('r') && !this.pressedKeys.includes('=') && this.pressedKeys.includes(this.addKey)) {
        this.isKeyPressed = true;
        this.rotateMainObject(1);
      }
  
      if (this.pressedKeys.includes('r') && !this.pressedKeys.includes('=') && this.pressedKeys.includes(this.subtractKey)) {
        this.isKeyPressed = true;
        this.rotateMainObject(-1);
      }
    }
  }
}

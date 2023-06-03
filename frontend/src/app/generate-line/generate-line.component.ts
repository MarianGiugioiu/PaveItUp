import { Component, ElementRef, Input, OnInit, Output, ViewChild, EventEmitter } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { GeometryService } from '../common/services/geometry.service';
import { cloneDeep, isEqual } from 'lodash';
import { EventsService } from '../common/services/events.service';
import { ISelect, TextureService } from '../common/services/texture.service';
import { SVGEnum } from '../common/enums/svg.enum';

export interface IPoint {
  name?: string;
  point?: THREE.Vector2;
  type?: string;
  object?: THREE.Mesh;
  text?: THREE.Mesh;
}

export interface IShape {
  partId?: string;
  id?: string;
  name?: string;
  textureType?: number;
  points?: IPoint[];
  wasInitialized?: boolean;
  position?: THREE.Vector3;
  rotation?: number;
  image?: string;
  color?: string;
}

@Component({
  selector: 'app-generate-line',
  templateUrl: './generate-line.component.html',
  styleUrls: ['./generate-line.component.scss']
})
export class GenerateLineComponent implements OnInit {
  @ViewChild('canvas') private canvasRef: ElementRef;
  private get canvas(): HTMLCanvasElement {
    return this.canvasRef?.nativeElement;
  }

  @Input() shape: IShape;
  @Input() isCanvasMinimized;
  @Input() canDoActions;
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
  public defaultSquareColor = 0x0069d9;
  private canvasWidth = 300;
  private canvasHeight = 300;
  private dragging = false;
  public selectedObject: THREE.Mesh;
  public selectedAdjacentObject: THREE.Mesh;
  private startPosition;
  private mouse: THREE.Vector2;
  private raycaster: THREE.Raycaster;
  private font;
  private textOffset = new THREE.Vector2(-0.045, -0.05);
  public pressedKeys = [];
  public vertexVisibility = true;
  public mainObjectRotation = Math.PI / 45;
  public regularPolygonEdgesNumber: number = 4;
  public cameraRatio = 1;
  initialIteration: IPoint[];
  previousIterations: IPoint[][];
  maxPreviousIterationsNumber = 50;
  currentShapeDuringPointMove: IPoint[];
  textureOptions: ISelect[];
  selectedOption;

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

  public SVGEnum = SVGEnum;

  constructor(
    public geometryService: GeometryService,
    public eventsService: EventsService,
    public textureService: TextureService
  ) { }

  ngOnInit(): void {
    this.textureLoader = new THREE.TextureLoader();
    this.fontLoader = new FontLoader();
    this.textureOptions = this.isSurface ? this.textureService.surfaceTextureOptions : this.textureService.shapeTextureOptions;
  }

  ngOnDistroy() {
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  async ngAfterViewInit() {
    let ratio = 1;
    if (this.isSurface) {
      ratio = 12; //Modificare suprafata
      this.cameraRatio = ratio;
      this.textOffset.x = this.textOffset.x * ratio;
      this.textOffset.y = this.textOffset.y * ratio;
    }
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;


    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
    this.renderer.shadowMap.enabled = true;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    this.camera = new THREE.OrthographicCamera(
      this.canvasWidth / -200 * ratio, // left
      this.canvasWidth / 200 * ratio, // right
      this.canvasHeight / 200 * ratio, // top
      this.canvasHeight / -200 * ratio, // bottom
      1, // near
      1000 // far
    );
    this.camera.position.set(0, 0, 10);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false;
    this.controls.update();

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.font = await this.fontLoader.loadAsync("assets/fonts/Roboto Medium_Regular.json");
    if (this.shape.color === undefined) {
      this.shape.color = 'rgba(255, 255, 255, 1)';
    }
    
    this.previousIterations = [];
    this.createPrimaryShape();
    
    
    if (!this.isSurface) {
      if (this.shape.rotation) {
        this.rotateMainObjectWithValue(-this.shape.rotation);
      }
    }

    this.initialIteration = cloneDeep(this.shape.points);

    if (!this.shape.wasInitialized) {
      this.shape.rotation = 0;
    }
    
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    this.onMouseDownListener = this.onMouseDown.bind(this);
    this.onMouseUpListener = this.onMouseUp.bind(this);
    this.onMouseMoveListener = this.onMouseMove.bind(this);
    this.onKeyDownListener = this.onKeyDown.bind(this);
    this.onKeyUpListener = this.onKeyUp.bind(this);
    
    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
      this.controls.update();
      if (!this.isSurface) {
        if (this.getImageData) {
          this.toggleVerticesVisibility(false);
          this.getImageData1 = true;
          this.getImageData = false;
        } else {
          if (this.getImageData1) {
            this.getImageData1 = false;
            this.shape.image = this.renderer.domElement.toDataURL("image/png");
            this.canvas.removeEventListener('mousemove', this.onMouseMoveListener);
            this.canvas.removeEventListener('mousedown', this.onMouseDownListener);
            this.canvas.removeEventListener('mouseup', this.onMouseUpListener);
  
            document.removeEventListener('keydown', this.onKeyDownListener);
            document.removeEventListener('keyup', this.onKeyUpListener);
  
            this.renderer.dispose()
            this.renderer.forceContextLoss();
            this.updateGetImageDataEvent.emit();
          }
        }
      }
    });
    
    this.canvas.addEventListener('mousemove', this.onMouseMoveListener);
    this.canvas.addEventListener('mousedown', this.onMouseDownListener);
    this.canvas.addEventListener('mouseup', this.onMouseUpListener);

    document.addEventListener('keydown', this.onKeyDownListener);
    document.addEventListener('keyup', this.onKeyUpListener);

    this.shape.wasInitialized = true;
  }

  addIteration(shape?) {
    if (this.previousIterations.length === this.maxPreviousIterationsNumber) {
      this.previousIterations.shift();
    }
    if (shape) {
      this.previousIterations.push(shape);
    } else {
      this.previousIterations.push(cloneDeep(this.shape.points));
    }
  }

  undoAction() {
    this.destroyShape();
    let newShape = this.previousIterations.pop();
    this.shape.points = cloneDeep(newShape);
    
    this.createPrimaryShape();
  }

  changesExist() {
    if (!this.initialIteration) {
      return false;
    }

    if (this.shape.points.length !== this.initialIteration.length) {
      return true;
    }


    for (let i = 0; i < this.shape.points.length; i++) {
      if (!isEqual(this.shape.points[i].point, this.initialIteration[i].point)) {
        return true;
      }
    }
    
    return false;
  }

  revertShape() {
    this.previousIterations = [];
    this.destroyShape();
    this.shape.points = cloneDeep(this.initialIteration);
    this.createPrimaryShape();
  }

  save() {
    const isValidShape = this.geometryService.doesPolygonHaveIntersectingEdges(this.shape.points.map(item => item.point));
    if (!isValidShape) {
      if (!this.isSurface) {
        this.rotateMainObjectWithValue(this.shape.rotation);
      }
      
      this.initialIteration = undefined;
      this.previousIterations = [];
      this.getImageData = true;
      this.toggleMinimize();
    }
  }

  toggleMinimize() {
    this.isCanvasMinimized = !this.isCanvasMinimized;
    if(this.shape.id === '0') {
      this.canDoActions = !this.canDoActions;
    }
    this.updateMinimizationEvent.emit(this.isCanvasMinimized);
  }

  toggleVerticesVisibility(value?) {
    this.vertexVisibility = value !== undefined ? value: !this.vertexVisibility;
    this.shape.points.forEach(item => {
      item.object.visible = this.vertexVisibility;
      item.text.visible = this.vertexVisibility;
    })
  }

  rotateMainObject(sign) {
    this.addIteration();
    
    const rotationMatrix = new THREE.Matrix4().makeRotationZ(sign * this.mainObjectRotation);
    this.shape.rotation -= sign * this.mainObjectRotation;
    
    this.mainObject.geometry.applyMatrix4(rotationMatrix);
    
    this.shape.points.map((item, index) => {
      item.object.position.applyMatrix4(rotationMatrix);
      this.shape.points[index].point = new THREE.Vector2(item.object.position.x, item.object.position.y);
      const textOffsetMultiplier = index > 9 ? 2 : 1;
      item.text.position.set(item.object.position.x + this.textOffset.x * textOffsetMultiplier, item.object.position.y + this.textOffset.y, 0);
    });
  }

  rotateMainObjectWithValue(value) {
    const rotationMatrix = new THREE.Matrix4().makeRotationZ(value);
    this.mainObject.geometry.applyMatrix4(rotationMatrix);
    
    this.shape.points.map((item, index) => {
      item.object.position.applyMatrix4(rotationMatrix);
      this.shape.points[index].point = new THREE.Vector2(item.object.position.x, item.object.position.y);
      const textOffsetMultiplier = index > 9 ? 2 : 1;
      item.text.position.set(item.object.position.x + this.textOffset.x * textOffsetMultiplier, item.object.position.y + this.textOffset.y, 0);
    });
  }

  destroyShape() {
    this.shape.points.forEach(item => {
      this.scene.remove(item.object);
      this.scene.remove(item.text);
    });
    this.scene.remove(this.mainObject);
  }

  rgbaToRgb(rgbaColor) {
    const rgbValues = rgbaColor.match(/\d+/g);
    return `rgb(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]})`;
  }

  changeColor() {
    const rgbValues = this.shape.color.match(/\d+/g);
    const rgb = `rgb(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]})`;
    const newColor = new THREE.Color(rgb);
    (this.mainObject.material as THREE.MeshBasicMaterial).color = newColor;
    if (rgbValues[3] && rgbValues[3] === '0') {
      (this.mainObject.material as THREE.MeshBasicMaterial).transparent = true;
      (this.mainObject.material as THREE.MeshBasicMaterial).opacity = +`0.${rgbValues[4]}`;
    }
  }

  changeTexture(value?) {
    if (value !== undefined) {
      this.shape.textureType = value;
    }
    const type = this.isSurface ? 'surface' : 'shape';
    const texture = this.textureService.textures[type][this.shape.textureType];
    const material = new THREE.MeshBasicMaterial({ map: texture });
    material.map.repeat.set(0.25 / this.cameraRatio, 0.25 / this.cameraRatio);
    material.map.offset.set(0.5, 0.5);
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.wrapT = THREE.RepeatWrapping;
    this.mainObject.material = material;
    this.changeColor();
  }

  createPrimaryShape() {
    this.drawMainObject();
    this.changeColor();
    
    this.shape.points.map((item, index) => {
      item.object = this.addPoint(item.point, `Point_${index.toString()}`);
      item.object.visible = this.vertexVisibility;
      item.text = this.addText(item.point ,index.toString());
      item.text.visible = this.vertexVisibility;
    });
    if (this.selectedObject) {
      this.selectedObject = this.shape.points.find(item => item.object.name === this.selectedObject.name)?.object;
    }
    if (this.selectedAdjacentObject) {
      this.selectedAdjacentObject = this.shape.points.find(item => item.object.name === this.selectedAdjacentObject.name)?.object;
    }
  }

  refreshShape() {
    this.regularPolygonEdgesNumber = 4;
    this.createRegularPolygon();
  }

  createRegularPolygon() {
    if (this.regularPolygonEdgesNumber && !isNaN(this.regularPolygonEdgesNumber) && this.regularPolygonEdgesNumber >= 3 && this.regularPolygonEdgesNumber <= 20) {
      let radius = Math.sqrt(2) / 2;
      if (this.isSurface) {
        radius *= this.cameraRatio;
      }
      const n = this.regularPolygonEdgesNumber;
      const angle = (2 * Math.PI) / n;
      const vertices = [];

      for (let i = 0; i < n; i++) {
        const x = -radius * Math.cos(i * angle);
        const y = radius * Math.sin(i * angle);
        const vertex = new THREE.Vector2(x, y);
        vertices.push(vertex);
      }
      this.destroyShape();
      this.shape.points = [];
      vertices.forEach(item => {
        this.shape.points.push({
          point: item,
          type: 'line'
        })
      });
      this.createPrimaryShape();
      this.rotateMainObjectWithValue(Math.PI / 4);
    }
  }

  selectVertex(i) {
    this.selectedObject = this.shape.points[i].object;
    this.selectedAdjacentObject = undefined;
  }


  selectEdge(i) {
    if (this.selectedObject) {
      const lastPos = this.shape.points.length - 1;
      const j = +(this.selectedObject.name.replace('Point_', ''));
      if (j === i) {
        if (i === lastPos) {
          this.selectedAdjacentObject = this.shape.points[0].object;
        } else {
          this.selectedAdjacentObject = this.shape.points[j + 1].object;
        }
      } else if (j === i + 1){
        if (i === -1) {
          this.selectedAdjacentObject = this.shape.points[lastPos].object;
        } else {
          this.selectedAdjacentObject = this.shape.points[j - 1].object;
        }
      }
    }
  }

  isEdgeSelected(i) {
    const lastPos = this.shape.points.length - 1;
    
    if (this.selectedObject && this.selectedAdjacentObject) {
      if (i === -1) {
        if (this.shape.points[0].object?.name === this.selectedObject?.name && this.shape.points[lastPos].object?.name === this.selectedAdjacentObject?.name) {
          return true;
        }
        return false;
      } else {
        if ((i < lastPos && this.shape.points[i+1]?.object?.name === this.selectedObject?.name)) {
          if (this.shape.points[i].object.name === this.selectedAdjacentObject.name) {
            return true;
          }
          return false;
        } else if (this.shape.points[i]?.object?.name === this.selectedObject?.name) {
          if ((i < lastPos && this.shape.points[i+1].object.name === this.selectedAdjacentObject.name) || (i === lastPos && this.shape.points[0].object.name === this.selectedAdjacentObject.name)) {
            
            return true;
          }
          return false;
        }
      }
    }
  }

  getAngle(i) {
    const lastPos = this.shape.points.length - 1;
    let point1 = this.shape.points[i];
    let point2;
    let point3;
    if (i === 0) {
      point2 = this.shape.points[lastPos];
      point3 = this.shape.points[i + 1];
    } else if (i === lastPos) {
      point2 = this.shape.points[i - 1];
      point3 = this.shape.points[0];
    } else {
      point2 = this.shape.points[i - 1];
      point3 = this.shape.points[i + 1];
    }
    if (point1.type === 'line' && point2.type === 'line' && point3.type === 'line') {
      return this.geometryService.calculateAngle(point1.point, point2.point, point3.point).toFixed(2);
    }
    else {
      return 'x';
    }
  }

  getEdgeLength(i) {
    const lastPos = this.shape.points.length - 1;
    let point1;
    let point2;
    if (i >= 0) {
      point1 = this.shape.points[i].point;
      if (i === lastPos) {
        point2 = this.shape.points[0].point;
      } else {
        point2 = this.shape.points[i + 1].point;
      }
    } else {
      point1 = this.shape.points[0].point;
      point2 = this.shape.points[lastPos].point;
    }
    return point1.distanceTo(point2);
  }

  addVertex(type = 'line') {
    if (this.selectedObject && this.selectedAdjacentObject) {
      this.addIteration();
      let i = +(this.selectedObject.name.replace('Point_', ''));
      let j = +(this.selectedAdjacentObject.name.replace('Point_', ''));
      const lastPos = this.shape.points.length - 1;
      const middle = new THREE.Vector2(
        (this.shape.points[i].point.x + this.shape.points[j].point.x) / 2,
        (this.shape.points[i].point.y + this.shape.points[j].point.y) / 2
      );
      const listLength = this.shape.points.length;
      
      let newPoint = {
        point: middle,
        type,
        object: this.addPoint(middle, `Point_${listLength.toString()}`, type),
        text: this.addText(middle ,listLength.toString()),
      }
  
      if ((j === 0 && i === lastPos) || (i === 0 && j === lastPos)) {
        this.shape.points.push(newPoint)
      } else {
        this.shape.points.splice(Math.max(i,j), 0, newPoint);
      }
      this.selectedObject = undefined;
      this.selectedAdjacentObject = undefined;
      
      this.refreshPoints();
    }
  }

  removeVertex() {
    if (this.selectedObject && this.shape.points.length > 3) {
      this.addIteration();
      let point = this.shape.points[+(this.selectedObject.name.replace('Point_', ''))];
      this.scene.remove(point.object);
      this.scene.remove(point.text);
      this.shape.points.splice(+(this.selectedObject.name.replace('Point_', '')), 1);
      this.selectedObject = undefined;
      this.selectedAdjacentObject = undefined;
      this.mainObject.geometry = this.createShape();
      this.refreshPoints();
    }
  }

  refreshPoints() {
    this.shape.points.map((item, index) => {
      item.object.name = `Point_${index.toString()}`;
      item.text.geometry = new TextGeometry(index.toString(), {
        font: this.font,
        size: 0.12 * this.cameraRatio,
        height: 2,
        curveSegments: 10,
        bevelEnabled: false
      });
    });
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

  changeShapeDimension() {
    this.addIteration();
    this.shape.points.forEach((elem, index) => {
      let value = 1.01
      if (this.sign < 0) {
        value = 1 / value;
      }
      elem.point.x *= value;
      elem.point.y *= value;
      elem.object.position.copy(new THREE.Vector3(elem.point.x, elem.point.y, 0));
      const textOffsetMultiplier = index > 9 ? 2 : 1;
      elem.text.position.set(elem.point.x + this.textOffset.x * textOffsetMultiplier, elem.point.y + this.textOffset.y, 0);
      this.mainObject.geometry = this.createShape();
    });
  }

  addText(position: THREE.Vector2, text: string) {
    const textGeometry = new TextGeometry(text, {
      font: this.font,
      size: 0.12 * this.cameraRatio,
      height: 2,
      curveSegments: 10,
      bevelEnabled: false
    });

    const textMaterial = new THREE.MeshPhongMaterial({emissive:0x0000ff, emissiveIntensity: 1});
    
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    const textOffsetMultiplier = (+text) > 9 ? 2 : 1;
    textMesh.position.set(position.x + this.textOffset.x * textOffsetMultiplier, position.y + this.textOffset.y, 0);
    this.scene.add(textMesh);
    
    return textMesh;
  }

  drawMainObject() {
    const type = this.isSurface ? 'surface' : 'shape';
    const texture = this.textureService.textures[type][this.shape.textureType];
    const material = new THREE.MeshBasicMaterial({ map: texture });
    material.map.repeat.set(0.25 / this.cameraRatio, 0.25 / this.cameraRatio);
    material.map.offset.set(0.5, 0.5);
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.wrapT = THREE.RepeatWrapping;
    this.mainObject = new THREE.Mesh(this.createShape(), material);
    this.mainObject.name = this.shape.name;
    const isVAlidShape = this.geometryService.doesPolygonHaveIntersectingEdges(this.shape.points.map(item => item.point));

    if (!isVAlidShape) {
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

  addPoint(position: THREE.Vector2, name, type = 'line') {
    let mesh;
    if(type === 'line') {
      const squareGeometry = new THREE.BoxGeometry(0.2 * this.cameraRatio, 0.2 * this.cameraRatio, 1);
      const squareMaterial = new THREE.MeshBasicMaterial({ color: this.defaultSquareColor });
      mesh = new THREE.Mesh(squareGeometry, squareMaterial);
    } else {
      const circleGeometry = new THREE.CircleGeometry(0.1 * this.cameraRatio, 32);
      const ciclreMaterial = new THREE.MeshBasicMaterial({ color: this.defaultSquareColor });
      mesh = new THREE.Mesh(circleGeometry, ciclreMaterial);
    }

    mesh.position.set(position.x, position.y, 0);
    mesh.name = name;

    this.scene.add(mesh);
    return mesh;
  };

  isButtonSelected(item: IPoint) {
    return item.object?.name === this.selectedObject?.name;
  }

  updatePoint(event, axis, item: IPoint) {
    const value = event.target.value;
    
    if (!isNaN(value)) {
      let position = item.object.position;
      if (axis === 'x') {
        position.x = parseFloat(value);
        this.movePoint(position, item)
      } else {
        position.y = parseFloat(value);;
        this.movePoint(position, item)
      }
    }
  }

  updateLength(event) {
    const value = event.target.value;
    if (value && !isNaN(value) && value > 0) {
      this.addIteration();
      let i = +(this.selectedObject.name.replace('Point_', ''));
      let j = +(this.selectedAdjacentObject.name.replace('Point_', ''));
      const newPoint = this.geometryService.changeEdgeLength(this.shape.points[i].point, this.shape.points[j].point, value);
      
        
      this.shape.points[j].point = newPoint;
      this.selectedAdjacentObject.position.copy(new THREE.Vector3(newPoint.x, newPoint.y, 0));
      const textOffsetMultiplier = j > 9 ? 2 : 1;
      this.shape.points[j].text.position.set(newPoint.x + this.textOffset.x * textOffsetMultiplier, newPoint.y + this.textOffset.y, 0);
      
      this.mainObject.geometry = this.createShape();
    }
  }

  getIndexFromName(obj: IPoint) {
    return +obj.object.name.replace('Point_', '');
  }

  movePoint(position, obj: IPoint) {
    obj.object.position.copy(position);
    
    const textOffsetMultiplier = this.getIndexFromName(obj) > 9 ? 2 : 1;
    obj.text.position.set(position.x + this.textOffset.x * textOffsetMultiplier, position.y + this.textOffset.y, 0);
    obj.point = new THREE.Vector2(position.x, position.y);
    
    const isVAlidShape = this.geometryService.doesPolygonHaveIntersectingEdges(this.shape.points.map(item => item.point));

    if (!isVAlidShape) {
      if (!this.mainObject.visible) {
        this.mainObject.visible = true;
      }
      this.mainObject.geometry = this.createShape();
    } else {
      if (this.mainObject.visible) {
        this.mainObject.visible = false;
      }
    }
  }

  onMouseMove(event) {
    this.mouse.x = ((event.clientX - this.canvas.offsetLeft ) / this.canvasWidth) * 2 - 1;
    this.mouse.y = -((event.clientY - this.canvas.offsetTop) / this.canvasHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.dragging) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      const intersect = this.raycaster.intersectObject(this.selectedObject)[0];
      if (intersect) {
        const position = intersect.point.sub(this.startPosition);
        this.movePoint(position, this.shape.points[+(this.selectedObject.name.replace('Point_', ''))]);
      }
    }
  };

  onMouseDown(event) {
    if (this.vertexVisibility) {
      const intersects = this.raycaster.intersectObjects(this.scene.children);

      if (intersects.length > 0) {
        this.selectedObject = intersects[0].object  as THREE.Mesh;
        
        if (intersects[0].object.name === this.shape.name && intersects[1] && this.vertexVisibility) {
          this.selectedObject = intersects[1].object  as THREE.Mesh;
        }
        
        if (this.selectedObject && this.selectedObject.name.includes('Point')) {
          this.currentShapeDuringPointMove = cloneDeep(this.shape.points);
          (this.selectedObject.material as THREE.MeshBasicMaterial).color.set(0xff0000);
          this.dragging = true;
          this.startPosition = intersects[0].point.sub(this.selectedObject.position);
        }
      }
    }
    
  };

  onMouseUp(event) {
    if (this.selectedObject && this.selectedObject.name.includes('Point')) {
      (this.selectedObject.material as THREE.MeshBasicMaterial).color.set(this.defaultSquareColor);
      this.addIteration(this.currentShapeDuringPointMove);
      this.currentShapeDuringPointMove = undefined;
      this.dragging = false;
      this.selectedObject = undefined;
      this.selectedAdjacentObject = undefined;
    }
  };

  onKeyUp(event: KeyboardEvent) {
    if (event.key === this.addKey || event.key === this.subtractKey) {
      this.isKeyPressed = false;
    }
    const index = this.pressedKeys.indexOf(event.key);
    this.pressedKeys.splice(index, 1);
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.pressedKeys.includes(event.key) && this.canDoActions) {
      this.pressedKeys.push(event.key);
    }

    if (this.canDoActions) {
      //Rotate anticlockwise
      if (this.pressedKeys.includes('r') && !this.pressedKeys.includes('=') && this.pressedKeys.includes(this.addKey)) {
        this.isKeyPressed = true;
        this.rotateMainObject(1);
      }

      //Rotate clockwise
      if (this.pressedKeys.includes('r') && !this.pressedKeys.includes('=') && this.pressedKeys.includes(this.subtractKey)) {
        this.isKeyPressed = true;
        this.rotateMainObject(-1);
      }

      //Increase size
      if (this.pressedKeys.includes('s') && this.pressedKeys.includes(this.addKey)) {
        this.isKeyPressed = true;
        this.sign = 1;
        this.changeShapeDimension()
      }
  
      //Decrease size
      if (this.pressedKeys.includes('s') && this.pressedKeys.includes(this.subtractKey)) {
        this.isKeyPressed = true;
        this.sign = -1;
        this.changeShapeDimension()
      }
      
      //Increase angle for one edge
      if (this.pressedKeys.includes('a') && !this.pressedKeys.includes('=') && this.pressedKeys.includes(this.addKey)) {
        this.isKeyPressed = true;
        this.sign = -1;
        this.value = 0;
        this.changeAngle();
      }

      //Decrease angle for one edge
      if (this.pressedKeys.includes('a') && !this.pressedKeys.includes('=') && this.pressedKeys.includes(this.subtractKey)) {
        this.isKeyPressed = true;
        this.sign = 1;
        this.value = 0;
        this.changeAngle();
      }
  
      //Increase angle for both edges
      if (this.pressedKeys.includes('a') && this.pressedKeys.includes('=') && this.pressedKeys.includes(this.addKey)) {
        this.isKeyPressed = true;
        this.sign = -1;
        this.value = 0;
        this.doubleChangeAngle();
      }

      //Decrease angle for both edges
      if (this.pressedKeys.includes('a') && this.pressedKeys.includes('=') && this.pressedKeys.includes(this.subtractKey)) {
        this.isKeyPressed = true;
        this.sign = 1;
        this.value = 0;
        this.doubleChangeAngle();
      }
  
      //Increase length for one edge
      if (this.pressedKeys.includes('l') && !this.pressedKeys.includes('=') && this.pressedKeys.includes(this.addKey)) {
        this.isKeyPressed = true;
        this.sign = 1;
        this.value = 0;
        this.changeLength();
      }

      //Decrease length for one edge
      if (this.pressedKeys.includes('l') && !this.pressedKeys.includes('=') && this.pressedKeys.includes(this.subtractKey)) {
        this.isKeyPressed = true;
        this.sign = -1;
        this.value = 0;
        this.changeLength();
      }
  
      //Increase length for both edges
      if (this.pressedKeys.includes('l') && this.pressedKeys.includes('=') && this.pressedKeys.includes(this.addKey)) {
        this.isKeyPressed = true;
        this.sign = 1;
        this.value = 0;
        this.doubleChangeLength();
      }

      //Decrease length for both edges
      if (this.pressedKeys.includes('l') && this.pressedKeys.includes('=') && this.pressedKeys.includes(this.subtractKey)) {
        this.isKeyPressed = true;
        this.sign = -1;
        this.value = 0;
        this.doubleChangeLength();
      }
  
      //Put point on mediating line
      if(this.pressedKeys.includes('x') && this.pressedKeys.includes(this.subtractKey)) {
        if (this.selectedObject) {
          let [i,j,k] = this.getAdjacentPoints();
    
          if (this.shape.points[i].type === 'line' && this.shape.points[j].type === 'line' && this.shape.points[k].type === 'line') {
            this.addIteration();
            const newPoint = this.geometryService.movePointToMediatingLine(this.shape.points[i].point, this.shape.points[j].point, this.shape.points[k].point);
            
            this.shape.points[i].point = newPoint;
            this.selectedObject.position.copy(new THREE.Vector3(newPoint.x, newPoint.y, 0));
            const textOffsetMultiplier = i > 9 ? 2 : 1;
            this.shape.points[i].text.position.set(newPoint.x + this.textOffset.x * textOffsetMultiplier, newPoint.y + this.textOffset.y, 0);
            
            this.mainObject.geometry = this.createShape();
          }
        }
      }
  
      //Make selected edge equal to the other edge
      if (this.pressedKeys.includes('x') && this.pressedKeys.includes(this.addKey)) {
        if (this.selectedObject && this.selectedAdjacentObject) {
          let [i,j,k] = this.getAdjacentPoint();
          
          if (this.shape.points[i].type === 'line' && this.shape.points[j].type === 'line' && this.shape.points[k].type === 'line') {
            this.addIteration();
            const newPoint = this.geometryService.equalizeEdges(this.shape.points[i].point, this.shape.points[j].point, this.shape.points[k].point);
            
            this.shape.points[j].point = newPoint;
            this.selectedAdjacentObject.position.copy(new THREE.Vector3(newPoint.x, newPoint.y, 0));
            const textOffsetMultiplier = j > 9 ? 2 : 1;
            this.shape.points[j].text.position.set(newPoint.x + this.textOffset.x * textOffsetMultiplier, newPoint.y + this.textOffset.y, 0);
            
            this.mainObject.geometry = this.createShape();
          }
        }
      }
    }
  }

  displayLine(i: number) {
    let lastPos = this.shape.points.length - 1;
    let j = i + 1;
    if (i === -1 || i === lastPos) {
      i = lastPos;
      j = 0;
    }
    
    if (this.shape.points[i]?.type === 'curve' || this.shape.points[j]?.type === 'curve') {
      return false;
    }

    return true;
  }

  getAdjacentPoints() {
    let i = +(this.selectedObject.name.replace('Point_', ''));
    let j, k;
    const lastPos = this.shape.points.length - 1;
    if (i === 0) {
      k = i + 1;
      j = lastPos;
    } else if (i === lastPos) {
      k = 0;
      j = i - 1;
    } else {
      k = i + 1;
      j = i - 1;
    }
    return [i, j, k];
  }

  getAdjacentPoint() {
    let i = +(this.selectedObject.name.replace('Point_', ''));
    let j = +(this.selectedAdjacentObject.name.replace('Point_', ''));
    let k;
    if (j < i || i === this.shape.points.length - 1) {
      k = i + 1;
      if (k === this.shape.points.length) {
        k = 0;
      }
    } else {
      k = i - 1;
      if (k === -1) {
        k = this.shape.points.length - 1;
      }
    }
    return [i, j, k];
  }
  
  changeAngle() {
    if (this.isKeyPressed && this.selectedObject && this.selectedAdjacentObject) {
      let [i, j, k] = this.getAdjacentPoint();
      
      if (this.shape.points[i].type === 'line' && this.shape.points[j].type === 'line') {
        this.value += this.sign * 0.01;
        const crossProductSign = this.geometryService.getDirectionOfRotation(this.shape.points[i].point, this.shape.points[j].point, this.shape.points[k].point);
        this.value *= crossProductSign;

        const newPoint = this.geometryService.rotateAroundPoint(this.shape.points[i].point, this.shape.points[j].point, this.value);
        const newCrossProductSign = this.geometryService.getDirectionOfRotation(this.shape.points[i].point, newPoint, this.shape.points[k].point);

        if (crossProductSign !== 0 && newCrossProductSign === crossProductSign) {
          this.addIteration();
          this.shape.points[j].point = newPoint;
          this.shape.points[j].object.position.copy(new THREE.Vector3(newPoint.x, newPoint.y, 0));
          const textOffsetMultiplier = j > 9 ? 2 : 1;
          this.shape.points[j].text.position.set(newPoint.x + this.textOffset.x * textOffsetMultiplier, newPoint.y + this.textOffset.y, 0);
  
          const isVAlidShape = this.geometryService.doesPolygonHaveIntersectingEdges(this.shape.points.map(item => item.point));

          if (!isVAlidShape) {
            if (!this.mainObject.visible) {
              this.mainObject.visible = true;
            }
            this.mainObject.geometry = this.createShape();
          } else {
            if (this.mainObject.visible) {
              this.mainObject.visible = false;
            }
          }
        }
      }
      setTimeout(() => {
        requestAnimationFrame(this.changeAngle.bind(this));
      }, 100);
    }
  }

  doubleChangeAngle() {
    if (this.isKeyPressed && this.selectedObject) {
      let [i,j,k] = this.getAdjacentPoints();
      
      if (this.shape.points[i].type === 'line' && this.shape.points[j].type === 'line' && this.shape.points[k].type === 'line') {
        this.value += this.sign * 0.01;
        const crossProductSign = this.geometryService.getDirectionOfRotation(this.shape.points[i].point, this.shape.points[j].point, this.shape.points[k].point);
        
        if (crossProductSign !== 0) {
          this.value *= crossProductSign;
        }

        const newPointJ = this.geometryService.rotateAroundPoint(this.shape.points[i].point, this.shape.points[j].point, this.value);
        const newPointK = this.geometryService.rotateAroundPoint(this.shape.points[i].point, this.shape.points[k].point, -this.value);
        const newCrossProductSign = this.geometryService.getDirectionOfRotation(this.shape.points[i].point, newPointJ, newPointK);

        if (crossProductSign !== 0 &&  newCrossProductSign === crossProductSign) {
          this.addIteration();
          this.shape.points[j].point = newPointJ;
          this.shape.points[j].object.position.copy(new THREE.Vector3(newPointJ.x, newPointJ.y, 0));
          let textOffsetMultiplier = j > 9 ? 2 : 1;
          this.shape.points[j].text.position.set(newPointJ.x + this.textOffset.x * textOffsetMultiplier, newPointJ.y + this.textOffset.y, 0);
  
          this.shape.points[k].point = newPointK
          textOffsetMultiplier = k > 9 ? 2 : 1;
          this.shape.points[k].object.position.copy(new THREE.Vector3(newPointK.x, newPointK.y, 0));
          this.shape.points[k].text.position.set(newPointK.x + this.textOffset.x * textOffsetMultiplier, newPointK.y + this.textOffset.y, 0);
    
          const isVAlidShape = this.geometryService.doesPolygonHaveIntersectingEdges(this.shape.points.map(item => item.point));

          if (!isVAlidShape) {
            if (!this.mainObject.visible) {
              this.mainObject.visible = true;
            }
            this.mainObject.geometry = this.createShape();
          } else {
            if (this.mainObject.visible) {
              this.mainObject.visible = false;
            }
          }
        }
      }
      
      setTimeout(() => {
        requestAnimationFrame(this.doubleChangeAngle.bind(this));
      }, 100);
    }
  }

  doubleChangeLength() {
    if (this.isKeyPressed && this.selectedObject) {
      let [i,j,k] = this.getAdjacentPoints();
      
      if (this.shape.points[i].type === 'line' && this.shape.points[j].type === 'line' && this.shape.points[k].type === 'line') {
        this.addIteration();
        this.value += this.sign * 0.01;
        let newPoint = this.geometryService.addToEdgeLength(this.shape.points[i].point, this.shape.points[j].point, this.value);
        this.shape.points[j].point = newPoint;
        this.shape.points[j].object.position.copy(new THREE.Vector3(newPoint.x, newPoint.y, 0));
        let textOffsetMultiplier = j > 9 ? 2 : 1;
        this.shape.points[j].text.position.set(newPoint.x + this.textOffset.x * textOffsetMultiplier, newPoint.y + this.textOffset.y, 0);

        newPoint = this.geometryService.addToEdgeLength(this.shape.points[i].point, this.shape.points[k].point, this.value);
        this.shape.points[k].point = newPoint;
        this.shape.points[k].object.position.copy(new THREE.Vector3(newPoint.x, newPoint.y, 0));
        textOffsetMultiplier = k > 9 ? 2 : 1;
        this.shape.points[k].text.position.set(newPoint.x + this.textOffset.x * textOffsetMultiplier, newPoint.y + this.textOffset.y, 0);
        
        this.mainObject.geometry = this.createShape();
      }
      
      setTimeout(() => {
        requestAnimationFrame(this.doubleChangeLength.bind(this));
      }, 100);
    }
  }

  changeLength() {
    if (this.isKeyPressed && this.selectedObject && this.selectedAdjacentObject) {
      this.value += this.sign * 0.01;
      
      let i = +(this.selectedObject.name.replace('Point_', ''));
      let j = +(this.selectedAdjacentObject.name.replace('Point_', ''));

      if (this.shape.points[i].type === 'line' && this.shape.points[j].type === 'line') {
        this.addIteration();
        const newPoint = this.geometryService.addToEdgeLength(this.shape.points[i].point, this.shape.points[j].point, this.value);
        
        this.shape.points[j].point = newPoint;
        this.selectedAdjacentObject.position.copy(new THREE.Vector3(newPoint.x, newPoint.y, 0));
        const textOffsetMultiplier = j > 9 ? 2 : 1;
        this.shape.points[j].text.position.set(newPoint.x + this.textOffset.x * textOffsetMultiplier, newPoint.y + this.textOffset.y, 0);
        
        this.mainObject.geometry = this.createShape();
      }
      
      setTimeout(() => {
        requestAnimationFrame(this.changeLength.bind(this));
      }, 100);
    }
  }

  
}

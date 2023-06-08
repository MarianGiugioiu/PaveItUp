import { Component, ElementRef, Input, OnInit, Output, ViewChild, EventEmitter, SimpleChanges } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { GeometryService } from '../common/services/geometry.service';
import { IShape } from '../generate-line/generate-line.component';
import { TextureService } from '../common/services/texture.service';

@Component({
  selector: 'app-place-shapes',
  templateUrl: './place-shapes.component.html',
  styleUrls: ['./place-shapes.component.scss']
})
export class PlaceShapesComponent implements OnInit {
  @ViewChild('canvas') private canvasRef: ElementRef;
  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  @Input() surface: IShape;
  @Input() parts: IShape[];
  @Input() fromHome: boolean;
  @Input() selectedPart: IShape;
  @Input() updateFromShape: boolean;
  @Input() getImageData;
  @Output() updateGetImageDataEvent = new EventEmitter();
  @Output() choosePartEvent = new EventEmitter();
  @Output() checkIntersectEvent = new EventEmitter();
  public bevelMeshes = {};
  public bevelValidColor = 0x444444;
  public bevelInvalidColor = 0xff0000;
  public surfaceMesh: THREE.Mesh;
  public partMeshes: THREE.Mesh[] = [];
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private controls: OrbitControls;
  private ambientLight: THREE.AmbientLight;
  private canvasWidth = 450;
  private canvasHeight = 450;
  private dragging = false;
  public selectedObject: THREE.Mesh;
  private startPosition;
  private mouse: THREE.Vector2;
  private raycaster: THREE.Raycaster;
  public pressedKeys = [];
  public vertexVisibility = false;
  public mainObjectRotation = Math.PI / 45;
  public regularPolygonEdgesNumber: number = 4;
  public cameraRatio = 4; //Modificare suprafata

  checkIntersectionAfterUpdate = false;

  getImageData1 = false;

  currentHeight;
  currentBh;
  mainObject: THREE.Mesh;
  heightPoint: THREE.Vector2;

  widthRatio: number;
  heightRatio: number;

  value: number = 0;
  public isKeyPressed = false;
  sign = -1;

  textureLoader: THREE.TextureLoader;
  fontLoader: FontLoader;

  onMouseDownListener: EventListener;
  onMouseUpListener: EventListener;
  onMouseMoveListener: EventListener;

  constructor(
    public geometryService: GeometryService,
    public textureService: TextureService
  ) { }

  ngOnInit(): void {
    this.textureLoader = new THREE.TextureLoader();
    this.fontLoader = new FontLoader();
  }

  ngOnChanges(changes: SimpleChanges) {
    for (let propName in changes) {
      if ((propName === 'parts' || propName === 'surface') && this.scene) {
        this.partMeshes.forEach(child => {
          if (child instanceof THREE.Mesh) {
            this.scene.remove(child);
          }
        });
        this.scene.remove(this.surfaceMesh);
        Object.keys(this.bevelMeshes).forEach(name => {
          this.scene.remove(this.bevelMeshes[name]);
          this.bevelMeshes[name] = undefined;
        });
        
        this.drawMesh(this.surface);
        this.partMeshes = [];
        this.parts.reverse().forEach(item => this.drawMesh(item));
        
        if (this.partMeshes.length) {
          this.checkIntersectionAfterUpdate = true;
        }
      } 
    }
  }

  ngOnDistroy() {
    this.canvas.removeEventListener('mousemove', this.onMouseMoveListener);
    this.canvas.removeEventListener('mousedown', this.onMouseDownListener);
    this.canvas.removeEventListener('mouseup', this.onMouseUpListener);
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }

  async ngAfterViewInit() {
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    
    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
    this.renderer.shadowMap.enabled = true;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    this.camera = new THREE.OrthographicCamera(
      this.canvasWidth / -200 * this.cameraRatio,
      this.canvasWidth / 200 * this.cameraRatio,
      this.canvasHeight / 200 * this.cameraRatio,
      this.canvasHeight / -200 * this.cameraRatio,
      1,
      1000
    );
    this.camera.position.set(0, 0, 10);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false;
    this.controls.update();

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.drawMesh(this.surface);
    this.parts.reverse().forEach(item => this.drawMesh(item));
    if (this.partMeshes.length && !this.fromHome) {
      this.checkMeshIntersects();
    }

    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    this.onMouseMoveListener = this.onMouseMove.bind(this);
    this.onMouseDownListener = this.onMouseDown.bind(this);
    this.onMouseUpListener = this.onMouseUp.bind(this);
    this.checkIntersectionAfterUpdate = true;
    
    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
      this.controls.update();
      if (this.checkIntersectionAfterUpdate && !this.fromHome) {
        this.checkMeshIntersects();
        this.checkIntersectionAfterUpdate = false;
      }
      if (this.getImageData) {
        this.getImageData1 = true;
        this.getImageData = false;
      } else if (this.getImageData1) {
        this.getImageData1 = false;
        const image = this.renderer.domElement.toDataURL("image/png");
        if (this.fromHome) {
          this.canvas.removeEventListener('mousemove', this.onMouseMoveListener);
          this.canvas.removeEventListener('mousedown', this.onMouseDownListener);
          this.canvas.removeEventListener('mouseup', this.onMouseUpListener);
  
          this.renderer.dispose()
          this.renderer.forceContextLoss();
        }
        this.updateGetImageDataEvent.emit(image);
      }
    });
    
    this.canvas.addEventListener('mousemove',  this.onMouseMoveListener);
    this.canvas.addEventListener('mousedown', this.onMouseDownListener);
    this.canvas.addEventListener('mouseup', this.onMouseUpListener);
  }

  getVertices(mesh: THREE.Mesh) {
    let positionArray = mesh.geometry.attributes['position'].array;
    
    let vertices: THREE.Vector3[] = [];
    const matrix = mesh.matrixWorld;
    
    for (var i = 0; i < positionArray.length; i += 3) {
      var vertex = new THREE.Vector3(
        positionArray[i],
        positionArray[i + 1],
        positionArray[i + 2]
      );
      vertex.applyMatrix4(matrix);
      vertices.push(vertex);
    }
    return vertices
  }

  checkMeshIntersects() {
    const len = this.partMeshes.length;
    let intersections = {};
    let verticesList = this.partMeshes.map(item => this.getVertices(item));
    for(let i = 0; i < len; i++) {
      intersections[this.partMeshes[i].name] = [];
    }
      
    for(let i = 0; i < len - 1; i++) {
      for(let j = i + 1; j < len; j++) {
        let result = this.geometryService.doPolygonsIntersect(verticesList[i], verticesList[j]);
        if (result) {
          intersections[this.partMeshes[i].name].push(this.partMeshes[j].name);
          intersections[this.partMeshes[j].name].push(this.partMeshes[i].name);
        } else {
          intersections[this.partMeshes[i].name] = intersections[this.partMeshes[i].name].filter(item => item !== this.partMeshes[j].name);
          intersections[this.partMeshes[j].name] = intersections[this.partMeshes[j].name].filter(item => item !== this.partMeshes[i].name);
        }
      }
    }
    let intersectsExists = false;
    for(let i = 0; i < len; i++) {
      const intLen = intersections[this.partMeshes[i].name].length;
      let intBevelMesh = this.bevelMeshes[this.partMeshes[i].name];
      if (intLen) {
        (intBevelMesh.material as THREE.MeshBasicMaterial).color.set(this.bevelInvalidColor);
        intersectsExists = true;
      } else {
        let vertices = this.getVertices(this.partMeshes[i]);
        const raycasterSurface = new THREE.Raycaster();
        let existsSurface = false;
        for (let vertex of vertices) {
          const direction = new THREE.Vector3(0, 0, -1);
          raycasterSurface.set(new THREE.Vector3(vertex.x, vertex.y, 5), direction);
          const intersect = raycasterSurface.intersectObject(this.surfaceMesh)[0];
          if (!intersect) {
            existsSurface = true;
          }
        }
        if (existsSurface) {
          (intBevelMesh.material as THREE.MeshBasicMaterial).color.set(this.bevelInvalidColor);  
          intersectsExists = true;
        } else {
          (intBevelMesh.material as THREE.MeshBasicMaterial).color.set(this.bevelValidColor); 
        }
      }
    }
    this.checkIntersectEvent.emit(intersectsExists);
  }

  rotateObjectWithValue(part: IShape) {
    let value = -part.rotation;
    const rotationMatrix = new THREE.Matrix4().makeRotationZ(value);
    let mesh = this.partMeshes.find(item => item.name === part.name);
    let bevelMesh = this.bevelMeshes[part.name];
    mesh.geometry.applyMatrix4(rotationMatrix);
    bevelMesh.geometry.applyMatrix4(rotationMatrix);
    
    part.points.map((item, index) => {
      let newPosition = new THREE.Vector3(item.point.x, item.point.y, mesh.position.z);
      newPosition.applyMatrix4(rotationMatrix);
      item.point = new THREE.Vector2(newPosition.x, newPosition.y);
    });
  }

  createShape(shape: IShape) {
    const shapeGeometry = new THREE.Shape();
    const lastPos = shape.points.length - 1;

    shapeGeometry.moveTo(shape.points[0].point.x, shape.points[0].point.y);

    for (let i = 1; i < shape.points.length; i++) {
      
      if (shape.points[i].type === 'line') {
        shapeGeometry.lineTo(shape.points[i].point.x, shape.points[i].point.y);
      } else {
        let cp;
        if (i === lastPos) {
          cp = this.geometryService.getCurveControlPoint(new THREE.Vector2(shape.points[i].point.x, shape.points[i].point.y), new THREE.Vector2(shape.points[i-1].point.x, shape.points[i-1].point.y), new THREE.Vector2(shape.points[0].point.x, shape.points[0].point.y));
          shapeGeometry.quadraticCurveTo(cp.x, cp.y, shape.points[0].point.x, shape.points[0].point.y);
        } else {
          let cp;
          if (i > 0) {
            cp = this.geometryService.getCurveControlPoint(new THREE.Vector2(shape.points[i].point.x, shape.points[i].point.y), new THREE.Vector2(shape.points[i-1].point.x, shape.points[i-1].point.y), new THREE.Vector2(shape.points[i+1].point.x, shape.points[i+1].point.y));
          } else {
            cp = this.geometryService.getCurveControlPoint(new THREE.Vector2(shape.points[lastPos].point.x, shape.points[lastPos].point.y), new THREE.Vector2(shape.points[i-1].point.x, shape.points[i-1].point.y), new THREE.Vector2(shape.points[i+1].point.x, shape.points[i+1].point.y));
          }
          shapeGeometry.quadraticCurveTo(cp.x, cp.y, shape.points[i + 1].point.x, shape.points[i + 1].point.y);
          i++;
        }
      }
    }

    shapeGeometry.closePath();
    
    return shapeGeometry;
  }


  drawMesh(shape: IShape) {
    let isSurface = shape.name.includes('Surface');
    
    let localRatio = 4;
    const type = isSurface ? 'surface' : 'shape';
    const texture = this.textureService.textures[type][shape.textureType];
    
    const material = new THREE.MeshBasicMaterial({ map: texture });
    material.map.repeat.set(0.25 / localRatio, 0.25 / localRatio);
    material.map.offset.set(0.5, 0.5);
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.wrapT = THREE.RepeatWrapping;

    let bevelSize = 0.05;
    if (isSurface) {
      bevelSize *= 3;
    }
    
    let shapeGeometry = this.createShape(shape);
    var extrudeSettings = {
      depth: 0,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize,
      bevelThickness: 1
    };
    let geometry = new THREE.ShapeGeometry(shapeGeometry);
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = 4;
    mesh.name = shape.name;
    if (shape.id === '0') {
      this.surfaceMesh = mesh;
    } else {
      this.partMeshes.push(mesh);
    }
    let bevelGeometry = new THREE.ExtrudeGeometry(shapeGeometry, extrudeSettings);
    let bevelMaterial = new THREE.MeshBasicMaterial( { color: this.bevelValidColor } );
    let bevelMesh = new THREE.Mesh(bevelGeometry, bevelMaterial);
    bevelMesh.position.z = 2;
    bevelMesh.name = shape.name + '_bevel';
    this.bevelMeshes[shape.name] = bevelMesh;
    this.scene.add(bevelMesh);
    if(shape.position) {
      mesh.position.copy(shape.position);
      bevelMesh.position.copy(new THREE.Vector3(mesh.position.x, mesh.position.y, 2));
    }

    if (isSurface) {
      mesh.position.z = 2;
      bevelMesh.position.z = 0;
    }
    
    const newColor = new THREE.Color(shape.color);
    mesh.material.color = newColor;
    this.scene.add(mesh);
  }

  moveMesh(position: THREE.Vector3, mesh: THREE.Mesh) {
    mesh.position.copy(position);
    (this.bevelMeshes[mesh.name] as THREE.Mesh).position.copy(new THREE.Vector3(position.x, position.y, 2));
    if (this.selectedPart) {
      this.selectedPart.position = position;
    }
    this.checkMeshIntersects();
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
        this.moveMesh(position, this.selectedObject);
      }
    }
  };

  onMouseDown(event) {
    const intersects = this.raycaster.intersectObjects(this.scene.children);
    
    if (intersects.length > 0) {
      this.selectedObject = intersects[0].object  as THREE.Mesh;
      
      if (this.selectedObject && this.selectedObject.name.includes('Part') && !this.selectedObject.name.includes('bevel')) {
        
        this.selectedPart = this.parts.find(item => item.name === this.selectedObject.name);
        
        this.dragging = true;
        this.startPosition = intersects[0].point.sub(this.selectedObject.position);
      }
    }
  };

  onMouseUp(event) {
    this.dragging = false;
    if (this.selectedPart) {
      this.choosePartEvent.emit(this.selectedPart.partId);
    }
    this.selectedObject = undefined;
    this.selectedPart = undefined;
  };
}

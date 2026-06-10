import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ToothState, ToothStatus } from '../../../core/models/patient.model';
import { TOOTH_MESH_MAP } from '../../../core/models/tooth-mesh-map';
import { DentalChartService } from '../../../core/services/dental-chart.service';

@Component({
  selector: 'app-three-dental-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="viewer-container" #container>
      <div *ngIf="loading" class="loading-overlay">
        <div class="spinner"></div>
        <span>Loading 3D Anatomy...</span>
      </div>
      <div class="canvas-wrapper" #canvasHolder></div>
    </div>
  `,
  styles: [`
    .viewer-container {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 250px;
      background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
    }
    .canvas-wrapper {
      width: 100%;
      height: 100%;
    }
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 0.85rem;
      gap: 0.75rem;
      z-index: 10;
      backdrop-filter: blur(4px);
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #334155;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class ThreeDentalViewerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() viewType: 'top' | 'frontal' | 'internal' | 'roots' = 'frontal';
  @Input() teethStatus: Record<string, ToothState> = {};
  @Input() interactive: boolean = true;
  @Input() highlightedTooth: string | null = null;

  @Output() toothClicked = new EventEmitter<string>();
  @Output() toothHovered = new EventEmitter<string | null>();

  @ViewChild('canvasHolder', { static: true }) canvasHolder!: ElementRef<HTMLDivElement>;

  loading = true;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private loader = new GLTFLoader();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private teethMeshes: Map<string, THREE.Object3D> = new Map();
  private originalMaterials: Map<THREE.Object3D, any> = new Map();
  private animationFrameId?: number;
  private resizeObserver?: ResizeObserver;
  private hoveredMesh: THREE.Object3D | null = null;

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.loadModel();
      this.animate();
    });

    // Handle resizing
    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
    this.resizeObserver.observe(this.canvasHolder.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['teethStatus'] && !changes['teethStatus'].firstChange) {
      this.applyColors();
    }
    if (changes['highlightedTooth']) {
      this.applyHighlight();
    }
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.controls) {
      this.controls.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initThree() {
    const width = this.canvasHolder.nativeElement.clientWidth || 300;
    const height = this.canvasHolder.nativeElement.clientHeight || 250;

    // Scene setup
    this.scene = new THREE.Scene();

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.setCameraPreset();

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.canvasHolder.nativeElement.appendChild(this.renderer.domElement);

    // Controls setup
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 40;
    this.controls.minDistance = 5;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(10, 15, 10);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight2.position.set(-10, -5, -10);
    this.scene.add(dirLight2);

    // Interaction events
    if (this.interactive) {
      this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
      this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
    }
  }

  private setCameraPreset() {
    switch (this.viewType) {
      case 'top':
        // Top view: looking directly down onto the upper arch
        this.camera.position.set(0, 16, 0);
        this.camera.lookAt(0, 0, 0);
        break;
      case 'frontal':
        // Frontal view: facing the front teeth
        this.camera.position.set(0, 0, 16);
        this.camera.lookAt(0, 0, 0);
        break;
      case 'internal':
        // Internal View: looking up from inside the mouth
        this.camera.position.set(0, -12, -3);
        this.camera.lookAt(0, 0, 0);
        break;
      case 'roots':
        // Roots View: focused lower/deeper on root structures
        this.camera.position.set(0, -15, 8);
        this.camera.lookAt(0, -2, 0);
        break;
    }
  }

  private loadModel() {
    // We load the permanent dentition GLTF model for Top/Frontal,
    // or simulate/load suitable meshes as configured.
    // If loading fails, we fallback to generating a premium mock arch
    const modelUrl = '3d/permanent_dentition/scene.gltf';

    this.loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        
        // Center & Scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 10 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));

        this.scene.add(model);

        // Traverse to find teeth meshes
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Map standard teeth to their FDI numbers
            const meshName = child.name;
            const fdiMatch = Object.entries(TOOTH_MESH_MAP).find(
              ([_, info]) => meshName.toLowerCase().includes(info.meshName.toLowerCase()) || child.name.includes(info.meshName)
            );

            if (fdiMatch) {
              const fdiId = fdiMatch[0];
              this.teethMeshes.set(fdiId, child);
              this.originalMaterials.set(child, child.material as any);
            }
          }
        });

        // If no explicit matching occurred due to mesh names inside the GLTF, map them programmatically by position
        if (this.teethMeshes.size === 0) {
          this.mapTeethMeshesByPositions(model);
        }

        this.loading = false;
        this.applyColors();
        this.applyHighlight();
      },
      undefined,
      (error) => {
        console.warn('Failed to load 3D GLTF model. Rendering high-fidelity procedural arch instead.', error);
        this.generateProceduralArch();
        this.loading = false;
        this.applyColors();
        this.applyHighlight();
      }
    );
  }

  // Fallback procedural builder in case GLTF assets are missing or take time to load
  private generateProceduralArch() {
    const group = new THREE.Group();
    const isUpper = this.viewType === 'top' || this.viewType === 'frontal';

    // Build 16 standard adult teeth in an elliptical arch shape
    const numTeeth = 16;
    for (let i = 0; i < numTeeth; i++) {
      const angle = (i / (numTeeth - 1)) * Math.PI - Math.PI / 2;
      const x = Math.cos(angle) * 5;
      const z = Math.sin(angle) * 3.5;
      const y = isUpper ? 0.5 : -0.5;

      const fdi = this.getFdiFromArchIndex(i, isUpper);

      // Create a premium tooth capsule geometry representation
      const toothGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.8, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.2,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(toothGeo, mat);
      mesh.position.set(x, y, z);
      mesh.rotation.y = -angle;
      mesh.name = `Tooth_${fdi}`;

      group.add(mesh);
      this.teethMeshes.set(fdi, mesh);
      this.originalMaterials.set(mesh, mat as any);
    }

    this.scene.add(group);
  }

  private mapTeethMeshesByPositions(model: THREE.Object3D) {
    const meshes: THREE.Mesh[] = [];
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child);
      }
    });

    // Map meshes to standard adult teeth based on x/y/z layout
    meshes.sort((a, b) => a.position.x - b.position.x);
    meshes.forEach((mesh, idx) => {
      const isUpper = mesh.position.y > 0;
      const fdi = this.getFdiFromArchIndex(idx % 16, isUpper);
      this.teethMeshes.set(fdi, mesh);
      this.originalMaterials.set(mesh, mesh.material as any);
    });
  }

  private getFdiFromArchIndex(index: number, isUpper: boolean): string {
    if (isUpper) {
      // Upper Right: 18 (index 0) to 11 (index 7). Upper Left: 21 (index 8) to 28 (index 15)
      return index < 8 ? (18 - index).toString() : (21 + (index - 8)).toString();
    } else {
      // Lower Right: 48 (index 0) to 41 (index 7). Lower Left: 31 (index 8) to 38 (index 15)
      return index < 8 ? (48 - index).toString() : (31 + (index - 8)).toString();
    }
  }

  private applyColors() {
    this.teethMeshes.forEach((mesh, fdi) => {
      const toothState = this.teethStatus[fdi];
      const status = toothState?.status || 'present';
      const colorHex = DentalChartService.STATUS_COLORS[status];

      const material = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (material) {
        if (status === 'present' || colorHex === 'none') {
          material.color.setHex(0xf8fafc); // Premium Off-white tooth color
          material.transparent = false;
          material.opacity = 1.0;
        } else {
          material.color.setStyle(colorHex);
          if (status === 'extracted' || status === 'missing') {
            material.transparent = true;
            material.opacity = 0.15;
          } else {
            material.transparent = false;
            material.opacity = 0.8;
          }
        }
        material.needsUpdate = true;
      }
    });
  }

  private applyHighlight() {
    this.teethMeshes.forEach((mesh, fdi) => {
      const isHighlighted = this.highlightedTooth === fdi;
      const material = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;

      if (material) {
        if (isHighlighted) {
          material.emissive.setHex(0x6366f1); // Glowing indigo highlight
          material.emissiveIntensity = 0.8;
        } else {
          material.emissive.setHex(0x000000);
          material.emissiveIntensity = 0;
        }
      }
    });
  }

  private onMouseMove(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(Array.from(this.teethMeshes.values()), true);

    if (intersects.length > 0) {
      let hitMesh = intersects[0].object;
      
      // Bubble up to parent if nested mesh
      while (hitMesh.parent && !this.findFdiByMesh(hitMesh) && hitMesh !== this.scene) {
        hitMesh = hitMesh.parent;
      }

      const fdi = this.findFdiByMesh(hitMesh);
      if (fdi && this.hoveredMesh !== hitMesh) {
        this.hoveredMesh = hitMesh;
        this.ngZone.run(() => {
          this.toothHovered.emit(fdi);
        });
      }
    } else {
      if (this.hoveredMesh !== null) {
        this.hoveredMesh = null;
        this.ngZone.run(() => {
          this.toothHovered.emit(null);
        });
      }
    }
  }

  private onMouseClick(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(Array.from(this.teethMeshes.values()), true);

    if (intersects.length > 0) {
      let hitMesh = intersects[0].object;
      while (hitMesh.parent && !this.findFdiByMesh(hitMesh) && hitMesh !== this.scene) {
        hitMesh = hitMesh.parent;
      }

      const fdi = this.findFdiByMesh(hitMesh);
      if (fdi) {
        this.ngZone.run(() => {
          this.toothClicked.emit(fdi);
        });
      }
    }
  }

  private findFdiByMesh(mesh: THREE.Object3D): string | null {
    for (const [fdi, item] of this.teethMeshes.entries()) {
      if (item === mesh || item.getObjectById(mesh.id)) {
        return fdi;
      }
    }
    return null;
  }

  private onResize() {
    const width = this.canvasHolder.nativeElement.clientWidth;
    const height = this.canvasHolder.nativeElement.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate() {
    this.ngZone.runOutsideAngular(() => {
      const render = () => {
        this.animationFrameId = requestAnimationFrame(render);
        if (this.controls) {
          this.controls.update();
        }
        this.renderer.render(this.scene, this.camera);
      };
      render();
    });
  }
}

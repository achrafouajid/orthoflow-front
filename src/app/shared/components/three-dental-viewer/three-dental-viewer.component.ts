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
import { toothStatusHex } from '../../../core/clinical/tooth-status';

/**
 * Resolves which FDI codes an arch's detected tooth groups should map to.
 * Returns null — never a guessed/shifted sequence — unless the geometry
 * produced exactly one group per FDI code in the sequence. Kept as a pure,
 * exported function so the safety rule is unit-testable without a WebGL
 * context or a loaded GLTF model.
 */
export function resolveArchFdiSequence(groupCount: number, fdiSequence: string[]): string[] | null {
  return groupCount === fdiSequence.length ? fdiSequence : null;
}

@Component({
  selector: 'app-three-dental-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="viewer-container" #container>
      <div *ngIf="lazy && !isLazyLoaded" class="lazy-overlay" (mouseenter)="loadLazy()" (click)="loadLazy()">
        <span class="material-icons text-3xl text-ortho-sky mb-2">three_d_rotation</span>
        <span class="text-xs font-semibold text-slate-300">Click or Hover to Load 3D View</span>
      </div>
      <div *ngIf="loading && (!lazy || isLazyLoaded)" class="loading-overlay">
        <div class="spinner"></div>
        <span>Loading 3D Anatomy...</span>
      </div>
      <div *ngIf="!loading && mappingFailed" class="loading-overlay" role="alert">
        <span class="material-icons text-3xl text-amber-400 mb-2">warning</span>
        <span>3D model could not be mapped to FDI notation; use the 2D chart.</span>
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
      color: #64748b;
      font-size: 0.85rem;
      gap: 0.75rem;
      z-index: 10;
      backdrop-filter: blur(4px);
    }
    .lazy-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.75);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 5;
      transition: background 0.3s ease;
      backdrop-filter: blur(2px);
    }
    .lazy-overlay:hover {
      background: rgba(15, 23, 42, 0.5);
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #334155;
      border-top-color: #03045e;
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
  @Input() lazy: boolean = false;

  @Output() toothClicked = new EventEmitter<string>();
  @Output() toothHovered = new EventEmitter<string | null>();

  @ViewChild('canvasHolder', { static: true }) canvasHolder!: ElementRef<HTMLDivElement>;

  loading = true;
  isLazyLoaded = false;
  /** True when the shipped model's geometry could not be mapped to exactly
   *  32 FDI-numbered teeth. Interaction is disabled rather than risk writing
   *  a clinical finding against the wrong tooth. */
  mappingFailed = false;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private loader = new GLTFLoader();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private teethMeshes: Map<string, THREE.Object3D[]> = new Map();
  private meshIdToFdi: Map<number, string> = new Map();
  private originalMaterials: Map<THREE.Object3D, any> = new Map();
  private animationFrameId?: number;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private hoveredMesh: THREE.Object3D | null = null;
  /** Paused while the tab is hidden or the viewer is scrolled off-screen —
   *  four of these could otherwise render at 60fps continuously regardless
   *  of visibility (audit VI.3). */
  private renderingPaused = false;
  private readonly onVisibilityChange = () => {
    this.renderingPaused = document.hidden;
    if (!this.renderingPaused) this.animate();
  };

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    if (!this.lazy) {
      this.isLazyLoaded = true;
      this.ngZone.runOutsideAngular(() => {
        this.initThree();
        this.loadModel();
        this.animate();
      });
    } else {
      this.loading = false;
    }

    // Handle resizing
    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
    this.resizeObserver.observe(this.canvasHolder.nativeElement);

    this.intersectionObserver = new IntersectionObserver((entries) => {
      const visible = entries[0]?.isIntersecting ?? true;
      this.renderingPaused = !visible || document.hidden;
      if (!this.renderingPaused) this.animate();
    });
    this.intersectionObserver.observe(this.canvasHolder.nativeElement);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  loadLazy() {
    if (this.isLazyLoaded) return;
    this.isLazyLoaded = true;
    this.loading = true;
    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.loadModel();
      this.animate();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['teethStatus'] && !changes['teethStatus'].firstChange) {
      this.applyColors();
    }
    if (changes['highlightedTooth']) {
      this.applyHighlight();
    }
    if (changes['viewType'] && !changes['viewType'].firstChange) {
      if (this.isLazyLoaded) {
        this.setCameraPreset();
        if (this.controls) {
          this.controls.target.set(0, 0, 0);
          this.controls.update();
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.controls) {
      this.controls.dispose();
    }
    this.disposeScene();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
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

  private static cachedModelPromise: Promise<THREE.Group> | null = null;

  private loadModel() {
    // We load the permanent dentition GLTF model for Top/Frontal,
    // or simulate/load suitable meshes as configured.
    // If loading fails, we fallback to generating a premium mock arch
    const modelUrl = '3d/permanent_dentition/scene.gltf';

    if (!ThreeDentalViewerComponent.cachedModelPromise) {
      ThreeDentalViewerComponent.cachedModelPromise = new Promise<THREE.Group>((resolve, reject) => {
        this.loader.load(
          modelUrl,
          (gltf) => {
            resolve(gltf.scene);
          },
          undefined,
          (error) => {
            ThreeDentalViewerComponent.cachedModelPromise = null; // Reset on failure so we can retry
            reject(error);
          }
        );
      });
    }

    ThreeDentalViewerComponent.cachedModelPromise.then(
      (cachedScene) => {
        // Clone the cached scene hierarchy
        const model = cachedScene.clone(true);
        
        // Center & Scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 10 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));

        this.scene.add(model);

        // Enable shadows on every mesh. Material cloning (so distinct teeth
        // don't share material state) and the FDI mapping both happen once,
        // together, in mapTeethMeshesByPositions — cloning here too meant
        // every material was cloned twice per load, with the first clone
        // immediately discarded (audit VI.3).
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // The FDI mapping measures world-space bounding boxes, but setting
        // scale/position above only writes the local transform — child world
        // matrices are not refreshed until the first render(). Without this,
        // mapping ran against the raw model coordinates: every tooth read as
        // above Y=0 (0 lower arch) and the 0.3-unit X grouping threshold,
        // which assumes the 10-unit normalised scale, merged 33 meshes into
        // 7 groups. Mapping then failed its 16+16 check and disabled the 3D
        // chart entirely.
        model.updateMatrixWorld(true);

        this.mapTeethMeshesByPositions(model);

        this.loading = false;
        this.applyColors();
        this.applyHighlight();
      },
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
      this.teethMeshes.set(fdi, [mesh]);
      this.originalMaterials.set(mesh, mat as any);
    }

    this.scene.add(group);
    this.rebuildMeshIndex();
  }

  private mapTeethMeshesByPositions(model: THREE.Object3D) {
    const meshes: THREE.Mesh[] = [];
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          child.material = (child.material as THREE.Material).clone();
        }
        meshes.push(child);
      }
    });

    // Helper to get true bounding box center
    const getMeshBox = (obj: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(obj);
      return box;
    };

    // Filter out obvious non-tooth geometry based on size and name
    const validTeethMeshes = meshes.filter(mesh => {
      const box = getMeshBox(mesh);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      const nameLower = mesh.name.toLowerCase();
      if (nameLower.includes('gum') || nameLower.includes('jaw') || nameLower.includes('bone')) {
        return false;
      }
      
      // If a mesh spans more than 4.0 units (entire arch is ~10), it's likely gums/jaw
      if (size.x > 4.0 || size.z > 4.0) {
        return false;
      }

      // Degenerate slivers are modelling artefacts, not teeth. The bundled
      // permanent_dentition model carries one (a 0.04-unit duplicate of the
      // upper right first molar) which otherwise counts as a 17th upper
      // "tooth" and fails the 16+16 check.
      if (Math.max(size.x, size.y, size.z) < 0.15) {
        return false;
      }
      return true;
    });

    // Partition into upper and lower by checking Y coordinate
    // The model is centered at origin, so occlusal plane is roughly Y=0
    const upperMeshes: THREE.Mesh[] = [];
    const lowerMeshes: THREE.Mesh[] = [];

    validTeethMeshes.forEach(mesh => {
      const box = getMeshBox(mesh);
      const center = new THREE.Vector3();
      box.getCenter(center);
      
      if (center.y > 0) {
        upperMeshes.push(mesh);
      } else {
        lowerMeshes.push(mesh);
      }
    });

    const getXWorld = (obj: THREE.Object3D) => {
      const box = getMeshBox(obj);
      const center = new THREE.Vector3();
      box.getCenter(center);
      return center.x;
    };

    const getZWorld = (obj: THREE.Object3D) => {
      const box = getMeshBox(obj);
      const center = new THREE.Vector3();
      box.getCenter(center);
      return center.z;
    };

    // Sort from left of screen to right of screen
    upperMeshes.sort((a, b) => getXWorld(a) - getXWorld(b));
    lowerMeshes.sort((a, b) => getXWorld(a) - getXWorld(b));

    // Group meshes that belong to the same tooth (X centers are very close)
    const groupMeshes = (meshList: THREE.Mesh[]): THREE.Mesh[][] => {
      const groups: THREE.Mesh[][] = [];
      meshList.forEach(mesh => {
        if (groups.length === 0) {
          groups.push([mesh]);
        } else {
          const lastGroup = groups[groups.length - 1];
          // Distance in the occlusal (XZ) plane, not X alone. An arch is a
          // curve: the second and third molars sit BEHIND each other, ~1.1
          // apart in Z but only ~0.1 apart in X. Comparing X alone merged
          // those distinct teeth into one group, so each arch came up short
          // of 16 and the whole chart was disabled.
          const dx = getXWorld(mesh) - getXWorld(lastGroup[0]);
          const dz = getZWorld(mesh) - getZWorld(lastGroup[0]);
          if (Math.hypot(dx, dz) < 0.3) {
            lastGroup.push(mesh);
          } else {
            groups.push([mesh]);
          }
        }
      });
      return groups;
    };

    const upperGroups = groupMeshes(upperMeshes);
    const lowerGroups = groupMeshes(lowerMeshes);

    // FDI Upper sequence (from patient's right 18 to left 28)
    const upperFDI = [
      '18', '17', '16', '15', '14', '13', '12', '11',
      '21', '22', '23', '24', '25', '26', '27', '28'
    ];

    // FDI Lower sequence (from patient's right 48 to left 38)
    const lowerFDI = [
      '48', '47', '46', '45', '44', '43', '42', '41',
      '31', '32', '33', '34', '35', '36', '37', '38'
    ];

    // Safety-critical: never guess a tooth's identity. A clinical status
    // written against the wrong tooth is a patient-safety defect, so an arch
    // is only mapped when the geometry produced EXACTLY the 16 groups an
    // adult arch has — no shifting, no partial mapping. See
    // resolveArchFdiSequence for the pure, unit-testable validation rule.
    const upperFdis = resolveArchFdiSequence(upperGroups.length, upperFDI);
    const lowerFdis = resolveArchFdiSequence(lowerGroups.length, lowerFDI);

    const applyMapping = (groups: THREE.Mesh[][], fdis: string[]) => {
      groups.forEach((groupMeshes, idx) => {
        const fdi = fdis[idx];
        this.teethMeshes.set(fdi, groupMeshes);
        groupMeshes.forEach(mesh => {
          this.originalMaterials.set(mesh, mesh.material as any);
          mesh.name = `Tooth_${fdi}`;
        });
      });
    };

    if (upperFdis && lowerFdis) {
      applyMapping(upperGroups, upperFdis);
      applyMapping(lowerGroups, lowerFdis);
      this.mappingFailed = false;
    } else {
      // Fail loudly rather than writing a clinical finding to the wrong
      // tooth. The template disables interaction and points to the 2D chart.
      console.error(
        `3D tooth mapping failed: expected 16 upper + 16 lower groups, got ${upperGroups.length} upper / ${lowerGroups.length} lower.`
      );
      this.teethMeshes.clear();
      this.mappingFailed = true;
    }
    this.rebuildMeshIndex();
  }

  /** O(1) mesh→FDI lookups for the raycast hit-test — previously
   *  findFdiByMesh walked every tooth's mesh list and called getObjectById
   *  on each, run on every mousemove (audit VI.3). */
  private rebuildMeshIndex() {
    this.meshIdToFdi.clear();
    for (const [fdi, meshes] of this.teethMeshes.entries()) {
      for (const mesh of meshes) {
        this.meshIdToFdi.set(mesh.id, fdi);
        mesh.traverse((child) => this.meshIdToFdi.set(child.id, fdi));
      }
    }
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
    this.teethMeshes.forEach((meshes, fdi) => {
      const toothState = this.teethStatus[fdi];
      const status = toothState?.status || 'present';
      // A WebGL material takes one flat colour — the family colour from
      // core/clinical/tooth-status.ts, the same source the 2D chart's
      // pattern fills derive from. null means "sound", keep the enamel look.
      const colorHex = toothStatusHex(status);

      meshes.forEach(mesh => {
        const material = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (material) {
          if (colorHex === null) {
            material.color.setHex(0xf8fafc); // Premium Off-white tooth color
            material.transparent = false;
            material.opacity = 1.0;
          } else {
            material.color.setHex(colorHex);
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
    });
  }

  private applyHighlight() {
    this.teethMeshes.forEach((meshes, fdi) => {
      const isHighlighted = this.highlightedTooth === fdi;
      
      meshes.forEach(mesh => {
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
    });
  }

  private lastMouseMoveAt = 0;

  private onMouseMove(event: MouseEvent) {
    // Throttled to ~30Hz — raycasting on every native mousemove event ran
    // far more often than the eye needs for a hover highlight (audit VI.3).
    const now = performance.now();
    if (now - this.lastMouseMoveAt < 33) return;
    this.lastMouseMoveAt = now;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const allMeshes = Array.from(this.teethMeshes.values()).flat();
    const intersects = this.raycaster.intersectObjects(allMeshes, true);

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
    const allMeshes = Array.from(this.teethMeshes.values()).flat();
    const intersects = this.raycaster.intersectObjects(allMeshes, true);

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
    return this.meshIdToFdi.get(mesh.id) ?? null;
  }

  private onResize() {
    // In lazy mode initThree() hasn't run yet the first time the
    // ResizeObserver fires, so `camera`/`renderer` don't exist (audit VI.3).
    if (!this.camera || !this.renderer) return;

    const width = this.canvasHolder.nativeElement.clientWidth;
    const height = this.canvasHolder.nativeElement.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate() {
    if (this.animationFrameId) return; // already looping
    this.ngZone.runOutsideAngular(() => {
      const render = () => {
        if (this.renderingPaused) {
          this.animationFrameId = undefined;
          return; // resumed by the visibility/intersection observers
        }
        this.animationFrameId = requestAnimationFrame(render);
        if (this.controls) {
          this.controls.update();
        }
        this.renderer.render(this.scene, this.camera);
      };
      render();
    });
  }

  /** Frees GPU resources on destroy — geometries, materials and textures
   *  were previously left behind, and with four viewers per patient this
   *  exhausted the browser's ~16-context WebGL budget after a handful of
   *  patient visits (audit III.5/VI.3). */
  private disposeScene() {
    if (!this.scene) return;
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      const materials = Array.isArray(material) ? material : material ? [material] : [];
      for (const mat of materials) {
        for (const key of Object.keys(mat)) {
          const value = (mat as any)[key];
          if (value && value instanceof THREE.Texture) {
            value.dispose();
          }
        }
        mat.dispose();
      }
    });
  }
}

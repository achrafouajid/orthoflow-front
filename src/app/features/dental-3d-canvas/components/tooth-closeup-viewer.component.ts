import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

/**
 * Close-up of a single tooth, shown beside the arch when one is selected.
 *
 * Only teeth with a real scanned model are rendered. There is currently one:
 * FDI 21, the maxillary left central incisor. Every other tooth reports that
 * no detailed model exists rather than substituting a stand-in — showing one
 * tooth's anatomy under another's number would be a clinical falsehood, and
 * this panel sits directly above the controls that write a diagnosis.
 */
const TOOTH_MODELS: Record<string, { obj: string; map: string; normalMap: string }> = {
  '21': {
    obj: '3d/tooth-ul1/UL1sketch1_1.OBJ',
    map: '3d/tooth-ul1/UL1sketch1_1-TM.png',
    normalMap: '3d/tooth-ul1/UL1sketch1_1-NM.png',
  },
};

@Component({
  selector: 'app-tooth-closeup-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="closeup">
      @if (!hasModel) {
        <div class="closeup-empty">
          <span class="material-icons" aria-hidden="true">view_in_ar</span>
          <span class="empty-title">Pas de modèle détaillé</span>
          <span class="empty-sub">Aucun modèle anatomique n'est disponible pour la dent {{ fdi }}.</span>
        </div>
      } @else {
        <div class="closeup-stage" #stage></div>
        @if (loading) {
          <div class="closeup-loading">
            <div class="spinner"></div>
            <span>Chargement du modèle…</span>
          </div>
        }
        @if (failed) {
          <div class="closeup-loading" role="alert">
            <span class="material-icons text-amber-600" aria-hidden="true">warning</span>
            <span>Modèle indisponible.</span>
          </div>
        }
        @if (!loading && !failed) {
          <span class="closeup-hint">Glisser pour pivoter · molette pour zoomer</span>
        }
      }
    </div>
  `,
  styles: [`
    .closeup {
      position: relative;
      width: 100%;
      height: 190px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      background: radial-gradient(circle at center, #ffffff 0%, #ffffff 55%, #eef1f5 100%);
      margin-bottom: 0.75rem;
    }
    .closeup-stage { width: 100%; height: 100%; }
    .closeup-empty,
    .closeup-loading {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      text-align: center;
      padding: 0 1rem;
      color: #64748b;
      background: rgba(255, 255, 255, 0.9);
    }
    .closeup-empty .material-icons { font-size: 26px; color: #94a3b8; }
    .empty-title { font-size: 0.8rem; font-weight: 700; color: #475569; }
    .empty-sub { font-size: 0.7rem; line-height: 1.35; }
    .closeup-loading { font-size: 0.72rem; }
    .closeup-hint {
      position: absolute;
      bottom: 6px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 0.62rem;
      color: #94a3b8;
      pointer-events: none;
    }
    .spinner {
      width: 20px; height: 20px;
      border: 2px solid #cbd5e1;
      border-top-color: #03045e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class ToothCloseupViewerComponent implements OnChanges, OnDestroy {
  @Input() fdi: string | null = null;

  /**
   * 'surface' renders the scanned mesh as-is.
   *
   * 'root' renders that same mesh translucent and draws a pulp canal inside
   * it. Read the canal as a schematic, not as data: the supplied model is a
   * surface scan with no internal anatomy, so the canal is derived from the
   * tooth's own cross-sections — a textbook illustration of where the canal
   * sits in a tooth this shape, NOT this patient's endodontic anatomy. It
   * must not be used to judge canal morphology, curvature or working length.
   */
  @Input() mode: 'surface' | 'root' = 'surface';

  @ViewChild('stage') stage?: ElementRef<HTMLDivElement>;

  loading = false;
  failed = false;

  get hasModel(): boolean {
    return !!this.fdi && !!TOOTH_MODELS[this.fdi];
  }

  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private controls?: OrbitControls;
  private frame?: number;
  private resizeObserver?: ResizeObserver;
  private disposables: Array<{ dispose: () => void }> = [];

  /** Parsing a 3.5 MB OBJ is expensive; keep it across panel open/close. */
  private static cache = new Map<string, Promise<THREE.Group>>();

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    // `mode` swaps the shell material and adds/removes the canal, so it needs
    // a rebuild just as much as `fdi` does.
    if (!changes['fdi'] && !changes['mode']) return;
    this.teardown();
    if (this.hasModel) {
      this.loading = true;
      this.failed = false;
      // Wait a tick so the stage element exists once *ngIf renders it.
      setTimeout(() => this.init(), 0);
    }
  }

  ngOnDestroy() {
    this.teardown();
  }

  private init() {
    const host = this.stage?.nativeElement;
    const cfg = this.fdi ? TOOTH_MODELS[this.fdi] : null;
    if (!host || !cfg) return;

    this.ngZone.runOutsideAngular(() => {
      const width = host.clientWidth || 260;
      const height = host.clientHeight || 190;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(width, height);
      host.appendChild(this.renderer.domElement);

      this.scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const key = new THREE.DirectionalLight(0xffffff, 0.85);
      key.position.set(4, 6, 8);
      this.scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.35);
      fill.position.set(-6, -2, -6);
      this.scene.add(fill);

      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.enablePan = false;
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 1.6;

      this.loadModel(cfg);

      const animate = () => {
        this.frame = requestAnimationFrame(animate);
        this.controls?.update();
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
      };
      animate();

      this.resizeObserver = new ResizeObserver(() => {
        const w = host.clientWidth, h = host.clientHeight;
        if (!w || !h || !this.camera || !this.renderer) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      });
      this.resizeObserver.observe(host);
    });
  }

  private loadModel(cfg: { obj: string; map: string; normalMap: string }) {
    const key = cfg.obj;
    if (!ToothCloseupViewerComponent.cache.has(key)) {
      ToothCloseupViewerComponent.cache.set(
        key,
        new Promise<THREE.Group>((resolve, reject) => {
          new OBJLoader().load(key, resolve, undefined, reject);
        }).catch(err => {
          // Don't poison the cache — a retry should be able to succeed.
          ToothCloseupViewerComponent.cache.delete(key);
          throw err;
        })
      );
    }

    ToothCloseupViewerComponent.cache.get(key)!
      .then(group => {
        if (!this.scene || !this.camera) return;
        const model = group.clone(true);

        const texLoader = new THREE.TextureLoader();
        const map = texLoader.load(cfg.map);
        const normalMap = texLoader.load(cfg.normalMap);
        map.colorSpace = THREE.SRGBColorSpace;
        this.disposables.push(map, normalMap);

        const isRoot = this.mode === 'root';
        const material = isRoot
          ? new THREE.MeshPhysicalMaterial({
              map,
              normalMap,
              roughness: 0.25,
              metalness: 0,
              transparent: true,
              opacity: 0.38,
              // Let the canal behind it show through instead of being
              // z-rejected by the shell's own depth writes.
              depthWrite: false,
              side: THREE.DoubleSide,
              clearcoat: 0.6,
              clearcoatRoughness: 0.3,
            })
          : new THREE.MeshStandardMaterial({
              map,
              normalMap,
              roughness: 0.45,
              metalness: 0.02,
            });
        this.disposables.push(material);

        model.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.material = material;
            if (isRoot) child.renderOrder = 2;   // shell draws after the canal
          }
        });

        if (isRoot) {
          // Built from the model's own local coordinates and parented to it,
          // so it inherits the centring/scaling applied below. Adding it to
          // the scene root instead would leave it in the raw model space.
          const canal = this.buildPulpCanal(model);
          if (canal) model.add(canal);
        }

        // Normalise: centre on the origin and scale to a predictable size, so
        // framing does not depend on the units the model was authored in.
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const centre = box.getCenter(new THREE.Vector3());
        const scale = 6 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        model.position.copy(centre).multiplyScalar(-scale);

        this.scene.add(model);
        this.camera.position.set(0, 1.5, 11);
        this.controls?.target.set(0, 0, 0);
        this.controls?.update();

        this.ngZone.run(() => {
          this.loading = false;
          this.cdr.markForCheck();   // app is zoneless: run() alone won't repaint
        });
      })
      .catch(err => {
        console.warn('Tooth close-up model failed to load', err);
        this.ngZone.run(() => {
          this.loading = false;
          this.failed = true;
          this.cdr.markForCheck();
        });
      });
  }

  /**
   * Derive a pulp chamber + root canal from the tooth's own geometry.
   *
   * The mesh is sliced along its longest axis; each slice contributes its
   * centroid (so the canal follows the tooth's curvature) and its half-width
   * (so the canal is always a fraction of the surrounding dentine and can
   * never poke through the shell). The profile is deliberately wide in the
   * crown and tapered to a fine apex, which is the shape of a real chamber —
   * but the numbers come from the outer surface, not from any scan of the
   * inside. See the note on `mode`.
   */
  private buildPulpCanal(model: THREE.Object3D): THREE.Mesh | null {
    const meshes: THREE.Mesh[] = [];
    model.traverse(o => { if (o instanceof THREE.Mesh) meshes.push(o); });
    if (!meshes.length) return null;

    model.updateMatrixWorld(true);
    const pts: THREE.Vector3[] = [];
    for (const mesh of meshes) {
      const pos = mesh.geometry.attributes['position'];
      if (!pos) continue;
      // Sampling every 5th vertex is plenty for a centreline and keeps this
      // well under a frame on a 129k-vertex scan.
      for (let i = 0; i < pos.count; i += 5) {
        pts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld));
      }
    }
    if (pts.length < 50) return null;

    const box = new THREE.Box3().setFromPoints(pts);
    const size = box.getSize(new THREE.Vector3());
    const axis: 'x' | 'y' | 'z' =
      size.y >= size.x && size.y >= size.z ? 'y' : size.x >= size.z ? 'x' : 'z';
    const other: Array<'x' | 'y' | 'z'> = (['x', 'y', 'z'] as const).filter(a => a !== axis) as any;

    const lo = box.min[axis], hi = box.max[axis];
    const SLICES = 26;
    const centres: THREE.Vector3[] = [];
    const halfWidths: number[] = [];

    for (let s = 0; s < SLICES; s++) {
      const a = lo + (hi - lo) * (s / SLICES);
      const b = lo + (hi - lo) * ((s + 1) / SLICES);
      const band = pts.filter(p => p[axis] >= a && p[axis] < b);
      if (band.length < 8) continue;
      const c = new THREE.Vector3();
      c[axis] = (a + b) / 2;
      let half = 0;
      for (const o of other) {
        const vals = band.map(p => p[o]);
        const mn = Math.min(...vals), mx = Math.max(...vals);
        c[o] = (mn + mx) / 2;
        half = Math.max(half, (mx - mn) / 2);
      }
      centres.push(c);
      halfWidths.push(half);
    }
    if (centres.length < 4) return null;

    // Which end is the crown? The wider one.
    const crownAtStart = halfWidths[0] > halfWidths[halfWidths.length - 1];
    if (!crownAtStart) { centres.reverse(); halfWidths.reverse(); }

    // Trim: the chamber starts inside the crown, the canal stops short of the
    // apical foramen rather than bursting out of the tip.
    const START = Math.floor(centres.length * 0.18);
    const END = Math.floor(centres.length * 0.94);
    const path = centres.slice(START, END);
    const widths = halfWidths.slice(START, END);
    if (path.length < 3) return null;

    const curve = new THREE.CatmullRomCurve3(path);
    const STEPS = 90, RADIAL = 14;
    const positions: number[] = [];
    const indices: number[] = [];
    const frames = curve.computeFrenetFrames(STEPS, false);

    for (let i = 0; i <= STEPS; i++) {
      const u = i / STEPS;                       // 0 = chamber, 1 = apex
      const p = curve.getPointAt(u);
      const w = widths[Math.min(widths.length - 1, Math.round(u * (widths.length - 1)))];
      // Fraction of local half-width: a broad chamber tapering to a thread.
      const frac = 0.34 * Math.pow(1 - u, 1.35) + 0.055;
      const r = Math.max(w * frac, 0.004);
      const N = frames.normals[Math.min(i, STEPS - 1)];
      const B = frames.binormals[Math.min(i, STEPS - 1)];
      for (let j = 0; j < RADIAL; j++) {
        const t = (j / RADIAL) * Math.PI * 2;
        positions.push(
          p.x + r * (Math.cos(t) * N.x + Math.sin(t) * B.x),
          p.y + r * (Math.cos(t) * N.y + Math.sin(t) * B.y),
          p.z + r * (Math.cos(t) * N.z + Math.sin(t) * B.z),
        );
      }
    }
    for (let i = 0; i < STEPS; i++) {
      for (let j = 0; j < RADIAL; j++) {
        const a = i * RADIAL + j;
        const b = i * RADIAL + ((j + 1) % RADIAL);
        const c = (i + 1) * RADIAL + j;
        const d = (i + 1) * RADIAL + ((j + 1) % RADIAL);
        indices.push(a, c, b, b, c, d);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const canalMat = new THREE.MeshStandardMaterial({
      color: 0xf2a0a4,          // pulp pink
      roughness: 0.55,
      metalness: 0,
      emissive: 0x4a1f22,       // lifts it out of shadow inside the shell
      emissiveIntensity: 0.25,
    });
    this.disposables.push(geom, canalMat);

    const canal = new THREE.Mesh(geom, canalMat);
    canal.renderOrder = 1;      // before the translucent shell
    return canal;
  }

  private teardown() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.controls?.dispose();
    this.controls = undefined;
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.scene?.traverse(o => {
      if (o instanceof THREE.Mesh) o.geometry?.dispose();
    });
    this.scene = undefined;
    this.camera = undefined;
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
      this.renderer = undefined;
    }
  }
}

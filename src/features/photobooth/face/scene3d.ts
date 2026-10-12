/**
 * three.js scene that renders the 3D face filters on a transparent canvas laid
 * over the camera video.
 *
 * Everything lives under one `faceRoot` group whose matrix is the tracked head
 * pose (smoothed), so any child positioned in canonical-face centimetres rides on
 * the user's head. Two invisible meshes — the canonical face and a cranium
 * ellipsoid — write depth only, so accessories are correctly hidden behind the
 * face (e.g. the arms of a pair of glasses, the back of a headband).
 *
 * Loaded lazily (see `useFaceEffect`), so three.js is only downloaded once a
 * visitor actually picks a filter.
 */

import {
  NeutralToneMapping,
  AmbientLight,
  Box3,
  DirectionalLight,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { CRANIUM, createCanonicalFaceGeometry } from './canonical'
import { EFFECT_SPECS } from './effect-specs'
import type { PartSpec } from './effect-specs'
import { PoseSmoother, quaternionFromDegrees } from './pose'
import type { EffectId } from '../types'

/** MediaPipe's face-geometry camera: 63 degrees vertical FOV (see face_geometry). */
const VERTICAL_FOV = 63

export type FaceScene = {
  /** Swap the active effect (`none` clears it). Resolves once its models are loaded. */
  setEffect(id: EffectId): Promise<void>
  /** Render one frame. `matrix` is the head pose, or null when no face is visible. */
  render(matrix: ArrayLike<number> | null, width: number, height: number): void
  dispose(): void
}

const modelUrl = (file: string): string => {
  const base = import.meta.env.BASE_URL || '/'
  return `${base.endsWith('/') ? base : `${base}/`}models/filters/${file}`
}

/** Centre a loaded model on its pivot and scale it to a real-world size in cm. */
function fitPart(model: Object3D, spec: PartSpec): Object3D {
  const box = new Box3().setFromObject(model)
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  const pivot = spec.pivot ?? [0, 0, 0]
  const pivotPoint = new Vector3(
    center.x + size.x * pivot[0],
    center.y + size.y * pivot[1],
    center.z + size.z * pivot[2],
  )
  model.position.sub(pivotPoint)

  const fit = spec.fit ?? 'x'
  const extent = size[fit] > 0 ? size[fit] : 1

  const scaled = new Group()
  scaled.add(model)
  const base = spec.size / extent
  const stretch = spec.scale ?? [1, 1, 1]
  scaled.scale.set(base * stretch[0], base * stretch[1], base * stretch[2])

  const holder = new Group()
  holder.add(scaled)
  holder.position.set(...spec.position)
  holder.quaternion.copy(quaternionFromDegrees(spec.rotation ?? [0, 0, 0]))
  return holder
}

export function createFaceScene(canvas: HTMLCanvasElement): FaceScene {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    // The capture path copies this canvas into the shot after it was drawn.
    preserveDrawingBuffer: true,
  })
  renderer.setPixelRatio(1)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NeutralToneMapping
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.add(new AmbientLight(0xffffff, 0.35))
  const key = new DirectionalLight(0xffffff, 1.6)
  key.position.set(0.4, 1, 1)
  scene.add(key)

  const camera = new PerspectiveCamera(VERTICAL_FOV, 4 / 3, 1, 10000)

  const faceRoot = new Group()
  faceRoot.matrixAutoUpdate = false
  faceRoot.visible = false
  scene.add(faceRoot)

  // Depth-only occluders: invisible, but they hide whatever is behind the head.
  const occluderMaterial = new MeshBasicMaterial({ colorWrite: false })
  const faceMesh = new Mesh(createCanonicalFaceGeometry(), occluderMaterial)
  faceMesh.renderOrder = -1
  faceRoot.add(faceMesh)
  const cranium = new Mesh(new SphereGeometry(1, 32, 24), occluderMaterial)
  cranium.position.set(...CRANIUM.center)
  cranium.scale.set(...CRANIUM.radii)
  cranium.renderOrder = -1
  faceRoot.add(cranium)

  let effectGroup: Group | null = null
  let effectToken = 0
  const loader = new GLTFLoader()
  const models = new Map<string, Promise<Object3D>>()
  const loadModel = (file: string): Promise<Object3D> => {
    let promise = models.get(file)
    if (!promise) {
      promise = loader.loadAsync(modelUrl(file)).then((gltf) => gltf.scene)
      models.set(file, promise)
    }
    return promise
  }

  const smoother = new PoseSmoother()
  const pose = new Matrix4()
  let width = 0
  let height = 0

  return {
    async setEffect(id) {
      const token = (effectToken += 1)
      if (effectGroup) {
        faceRoot.remove(effectGroup)
        effectGroup = null
      }
      if (id === 'none') return

      const spec = EFFECT_SPECS[id]
      const group = new Group()
      for (const part of spec.parts) {
        const source = part.build ? part.build() : part.model ? (await loadModel(part.model)).clone(true) : null
        if (!source) continue
        const holder = fitPart(source, part)
        holder.traverse((object) => {
          object.renderOrder = 1
        })
        group.add(holder)
      }
      cranium.visible = spec.occlude !== false
      faceMesh.visible = spec.occlude !== false
      // Ignore a result that a newer selection already replaced.
      if (token !== effectToken) return
      effectGroup = group
      faceRoot.add(group)
    },

    render(matrix, nextWidth, nextHeight) {
      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth
        height = nextHeight
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
      if (matrix) {
        faceRoot.matrix.copy(smoother.update(matrix, pose))
        faceRoot.matrixWorldNeedsUpdate = true
        faceRoot.visible = effectGroup !== null
      } else {
        smoother.reset()
        faceRoot.visible = false
      }
      renderer.render(scene, camera)
    },

    dispose() {
      effectToken += 1
      renderer.dispose()
      pmrem.dispose()
    },
  }
}

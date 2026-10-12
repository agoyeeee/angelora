// Copies the MediaPipe Tasks Vision WASM runtime from node_modules into
// public/mediapipe/ so the face filters are served from our own origin
// (no third-party CDN, PRD §12). Runs automatically before `dev` and `build`.
import { cpSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(root, 'node_modules/@mediapipe/tasks-vision/wasm')
const to = join(root, 'public/mediapipe')

mkdirSync(to, { recursive: true })
cpSync(from, to, { recursive: true })
console.log(`[mediapipe] copied wasm runtime to ${to}`)

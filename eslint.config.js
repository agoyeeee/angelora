import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

// eslint-plugin-react-refresh exposes its Vite preset either as a config object
// or (newer versions) as a factory function.
const reactRefreshConfig =
  typeof reactRefresh.configs.vite === 'function'
    ? reactRefresh.configs.vite()
    : reactRefresh.configs.vite

// eslint-plugin-react-hooks v6+ exposes flat presets under configs.flat.*.
const reactHooksConfig =
  reactHooks.configs.flat?.['recommended-latest'] ??
  reactHooks.configs['recommended-latest']

export default tseslint.config([
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'src/routeTree.gen.ts',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooksConfig,
      reactRefreshConfig,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    // TanStack Router file-based route files legitimately export a non-component
    // `Route` object alongside the route component, which conflicts with the
    // react-refresh component-only heuristic.
    files: ['src/routes/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // PRD §10: keep the photobooth logic modules (camera-service, canvas-composer,
    // filters, frames, session-reducer) free of React so they stay testable and
    // replaceable without touching the UI.
    files: [
      'src/features/photobooth/{camera-service,canvas-composer,filters,frames,session-reducer}.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'react',
            'react/*',
            'react-dom',
            'react-dom/*',
            'motion',
            'motion/*',
            '@tanstack/react-router',
            '@tanstack/react-router/*',
          ],
        },
      ],
    },
  },
  {
    // Node-context config/tooling files.
    files: ['*.config.{js,ts}', 'e2e/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
])

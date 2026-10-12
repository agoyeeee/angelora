import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // TanStack Router plugin must run before the React plugin.
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      disableLogging: true,
    }),
    react(),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    restoreMocks: true,
    clearMocks: true,
    // Playwright owns `e2e/**/*.spec.ts`; keep Vitest out of that directory so
    // `npm run test` only collects the component/unit suites under `src`.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})

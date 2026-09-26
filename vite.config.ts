import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import dts from 'unplugin-dts/vite'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { dependencies?: Record<string, string>; peerDependencies?: Record<string, string> }

const ext = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.dependencies ?? {})
]

// vite config can not read babel.config.js
export default defineConfig({
  build: {
    minify: true,
    lib: {
      fileName: (type) => {
        if (type === 'es') return 'esm/index.js';
        if (type === 'cjs') return 'index.cjs';
        return 'index.js';
      },
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
    },
    sourcemap: false,
    // 清空 dist
    emptyOutDir: true,
    rollupOptions: {
      external: (id) =>
        ext.some((e) => id === e || id.startsWith(e + '/')),
      // output: {
      //   preserveModules: true,
      //   preserveModulesRoot: 'src',
      // },
    },
  },
  
  plugins: [
    // https://www.npmjs.com/package/vite-plugin-dts
    dts({
      include: 'src',
      exclude: ['src/demo.ts'],
      bundleTypes: true,
      afterBuild: () => {
        // do something else
      },
    }),
    react()
  ],
});
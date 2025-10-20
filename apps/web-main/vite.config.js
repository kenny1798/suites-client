// apps/web-main/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react','react-dom','react-router','react-router-dom','@emotion/react','@emotion/cache'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: [
      'react/jsx-runtime',
      'react-select','memoize-one','use-isomorphic-layout-effect','hoist-non-react-statics',
      '@emotion/react','@emotion/cache','@floating-ui/dom','@tanstack/react-virtual',
      '@headlessui/react','recharts','clsx','decimal.js-light','scheduler',
    ],
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    https: 
    {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/localhost.pem')),
    }
    ,
    fs: { allow: [path.resolve(__dirname, '../../')] },
    proxy: { '/api': { target: 'https://localhost:3001', changeOrigin: true, secure: false } }
  }
})

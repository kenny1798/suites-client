/** @type {import('tailwindcss').Config} */
import path from 'node:path'
const r = (p) => p.replace(/\\/g, '/')

export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',

    // HANYA packages yang memang guna Tailwind
    r(path.resolve(__dirname, '../../packages/ui/**/*.{js,jsx,ts,tsx}')),
    r(path.resolve(__dirname, '../../packages/auth/**/*.{js,jsx,ts,tsx}')),
    r(path.resolve(__dirname, '../../packages/salestrack/**/*.{js,jsx,ts,tsx}')),

    // EXCLUDE supaya tak sapu benda berat
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/.next/**',
    '!**/build/**',
  ],
  theme: { extend: {} },
  plugins: [],
}

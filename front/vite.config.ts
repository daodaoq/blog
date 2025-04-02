import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite'

// 兼容 ES 模块的 __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载环境变量
const env = loadEnv('', process.cwd());

// Vite 配置
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 修正 __dirname
    },
  },
  server: {
    host: '0.0.0.0',
    port: 80,
    proxy: {
      '/api': {
        target: env.VITE_SERVER_URL,
        changeOrigin: true,
      },
      '/uploads': {
        target: env.VITE_SERVER_URL,
        changeOrigin: true,
      },
    },
  },
});

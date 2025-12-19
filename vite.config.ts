import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { readFileSync } from 'fs';

export default defineConfig({
  // 项目根目录
  root: '.',
  // 路径别名解析
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 插件配置
  plugins: [
    vue(), // Vue 插件
    {
      name: 'load-e-files',
      load(id) {
        if (id.endsWith('.e')) {
          const filePath = id.replace(/\?.*$/, ''); // 移除查询参数
          const content = readFileSync(filePath, 'utf-8');
          return `export default ${JSON.stringify(content)};`;
        }
      },
    },
  ],
  // 构建配置
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  // 开发服务器配置
  server: {
    port: 9527,
    open: true,
  },
});


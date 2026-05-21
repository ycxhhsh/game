import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        styleLab: path.resolve(__dirname, 'style-lab.html')
      }
    }
  },
  server: {
    port: 5888,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});

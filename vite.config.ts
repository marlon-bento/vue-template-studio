/*
========
Configuração de build e testes automatizados da biblioteca vue-template-studio (vite.config.ts).
Configura o empacotamento em modo biblioteca (ES e UMD), deduplicação de vue e vue-i18n,
geração automática de declarações TypeScript (.d.ts), compilação de SCSS com style.css unificado
e ambiente happy-dom para Vitest.
========
*/
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
    dedupe: ['vue', 'vue-i18n']
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist'
    })
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    reporters: ['basic']
  },
  build: {
    minify: false,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VCertificado',
      fileName: 'vue-template-studio'
    },
    rollupOptions: {
      external: ['vue', 'vue-i18n'],
      output: {
        globals: {
          vue: 'Vue',
          'vue-i18n': 'VueI18n'
        },
        exports: 'named',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'style.css';
          }
          return assetInfo.name || 'assets/[name][extname]';
        }
      }
    }
  }
});

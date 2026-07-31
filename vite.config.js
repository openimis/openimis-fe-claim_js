import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path' 
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: '@emotion/react',
    }),
    svgr()
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.jsx'),
      name: 'OpenIMISFeClaim',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'es' : 'cjs'}.js`
    },
   
    sourcemap: true,
    outDir: 'dist',
    rollupOptions: {
      external: [
        /^react.*/,
        /^redux.*/,
        'redux-api-middleware',
        'react-intl',
        'prop-types',
        'moment',
        /^lodash.*/,
        'lodash-uuid',
        'classnames',
        'clsx',
        'react-autosuggest',
        'history',
        /^@mui\/material/,
        /^@mui\/icons-material/,
        /^@emotion\/react/,
        /^@emotion\/styled/,
        /^@emotion\/cache/,
        /^@mui\/system/,
        '@date-io/core',
        '@date-io/moment',
        '@openimis/fe-core',
        /^@babel-.*/, 
        /^@openimis.*/
      ],
      output: { 
        globals: {
          'react': 'React',
          'react/jsx-runtime': 'jsxRuntime',
          'react-dom': 'ReactDOM'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import pkg from './package.json' with { type: 'json' };

export default [
  // ESModule 빌드
  {
    input: 'src/index.js',
    output: {
      file: pkg.module,           // dist/index.esm.js
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve(),
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-react'],
        exclude: 'node_modules/**'
      }),
      commonjs(),
    ],
    external: ['react', 'react-dom', 'react-plaid-link']
  },
  // CommonJS 빌드
  {
    input: 'src/index.js',
    output: {
      file: pkg.main,             // dist/index.cjs.js
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      resolve(),
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-react'],
        exclude: 'node_modules/**'
      }),
      commonjs(),
      terser()                    // 최소화(옵션)
    ],
    external: ['react', 'react-dom', 'react-plaid-link']
  }
];

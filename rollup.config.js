import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json' with { type: 'json' };

export default [
  // ESModule 빌드
  {
    input: 'src/index.tsx',
    output: {
      file: pkg.module,           // dist/index.mjs
      format: 'es',
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        clean: true,
        useTsconfigDeclarationDir: true
      }),
      resolve({ browser: true, preferBuiltins: false }),
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-react'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        exclude: 'node_modules/**'
      }),
      commonjs(),
    ],
    external: ['react', 'react-dom']
  },
  // CommonJS 빌드
  {
    input: 'src/index.tsx',
    output: {
      file: pkg.main,             // dist/index.cjs
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        clean: true,
        useTsconfigDeclarationDir: true
      }),
      resolve({ browser: true, preferBuiltins: false }),
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-react'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        exclude: 'node_modules/**'
      }),
      commonjs(),
      terser()                    // 최소화(옵션)
    ],
    external: ['react', 'react-dom']
  }
];

import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/_worker.js',
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: false,
  sourcemap: false,
  external: [],
  conditions: ['worker', 'browser'],
  mainFields: ['browser', 'module', 'main'],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

console.log('✅ Build complete: dist/_worker.js');

import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/berial.js',
    format: 'umd',
    sourcemap: true,
    name: 'berial',
  },
  plugins: [typescript()],
}

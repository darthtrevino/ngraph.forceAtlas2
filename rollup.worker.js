import path from 'path'
import resolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript'
// import { terser } from 'rollup-plugin-terser'

export default {
	input: path.join(__dirname, 'src/worker.ts'),
	treeshake: true,
	output: {
		file: path.join(__dirname, 'dist/fa2_worker.js'),
		format: 'cjs',
	},
	plugins: [
		typescript(),
		resolve({
			extensions: ['.js', '.ts'],
		}),
	],
}

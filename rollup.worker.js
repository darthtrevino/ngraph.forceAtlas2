import path from 'path'
import resolve from 'rollup-plugin-node-resolve'
// import { terser } from 'rollup-plugin-terser'

export default {
	input: path.join(__dirname, 'src/worker.js'),
	treeshake: true,
	output: {
		file: path.join(__dirname, 'dist/fa2_worker.js'),
		format: 'cjs',
	},
	plugins: [resolve()],
}

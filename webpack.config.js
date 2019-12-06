const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
	entry: path.join(__dirname, 'example/src/index.tsx'),
	output: {
		filename: './index.js',
	},
	devServer: {
		hot: false,
		hotOnly: false,
		inline: false,
		liveReload: false,
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
	},
	module: {
		rules: [
			// all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
			{ test: /\.tsx?$/, loader: 'ts-loader' },
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.join(__dirname, 'example/index.html'),
		}),
	],
}

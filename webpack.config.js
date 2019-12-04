const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.join(__dirname, "example/index.js"),
  output: {
    filename:  "./dist/index.js"
  },
  plugins: [new HtmlWebpackPlugin({
    template:path.join(__dirname, 'example/index.html')
  })]
}
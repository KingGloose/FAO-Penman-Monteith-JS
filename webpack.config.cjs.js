// webpack.config.cjs.js
const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.cjs.js",
    libraryTarget: "commonjs2",
  },
  target: "node",
  mode: "production",
});

// webpack.config.esm.js
const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.esm.js",
    library: {
      type: "module",
    },
  },
  experiments: {
    outputModule: true,
  },
  mode: "production",
});

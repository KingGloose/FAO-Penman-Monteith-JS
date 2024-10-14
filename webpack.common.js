const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  entry: "./src/index.ts",
  mode: "production",
  devtool: false,
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "index.js",
  },
  resolve: {
    extensions: [".js", ".json", ".ts"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [new CleanWebpackPlugin()],
};

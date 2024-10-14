const path = require("path");

module.exports = {
  mode: "production",
  devtool: false,
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "index.js",
    library: "faopm-js", // 库名称
    libraryTarget: "umd", // 支持 CommonJS 和 ESM
    globalObject: "this", // 让库在 Node.js 和浏览器中都可用
  },
  resolve: {
    extensions: [".ts", ".js"], // 处理的文件扩展名
  },
  externals: {
    mathjs: "mathjs",
  },
  module: {
    rules: [
      {
        test: /\.ts$/, // 匹配 TypeScript 文件
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
};

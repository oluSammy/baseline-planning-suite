import path from "node:path";
import HtmlWebpackPlugin from "html-webpack-plugin";

export default (_env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    mode: isProduction ? "production" : "development",
    entry: "./src/index.ts",
    output: {
      path: path.resolve(import.meta.dirname, "dist"),
      publicPath: "auto",
      clean: true,
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "swc-loader",
            options: {
              jsc: {
                parser: { syntax: "typescript", tsx: true },
                transform: { react: { runtime: "automatic" } },
              },
            },
          },
        },
      ],
    },
    plugins: [new HtmlWebpackPlugin({ template: "./public/index.html" })],
    devServer: {
      port: 8081,
      historyApiFallback: true,
      headers: { "Access-Control-Allow-Origin": "*" },
    },
    devtool: isProduction ? "source-map" : "eval-source-map",
  };
};

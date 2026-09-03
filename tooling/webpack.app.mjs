import { ModuleFederationPlugin } from "@module-federation/enhanced/webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import path from 'node:path'

export function createAppConfig({
  name,
  dirname,
  port,
  mode,
  dependencies,
  exposes = {},
  plugins = [],
}) {
  const isProduction = mode === "production";

  return {
    mode: isProduction ? "production" : "development",
    entry: "./src/index.ts",
    output: {
      path: path.resolve(dirname, "dist"),
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
    plugins: [
      new HtmlWebpackPlugin({ template: "./public/index.html" }),
      new ModuleFederationPlugin({
        name,
        filename: "remoteEntry.js",
        exposes,
        shared: {
          react: { singleton: true, requiredVersion: dependencies.react },
          "react-dom": { singleton: true, requiredVersion: dependencies["react-dom"] },
        },
        dts: false,
      }),
      ...plugins,
    ],
    devServer: {
      port,
      historyApiFallback: true,
      headers: { "Access-Control-Allow-Origin": "*" },
    },
    devtool: isProduction ? "source-map" : "eval-source-map",
  };
}

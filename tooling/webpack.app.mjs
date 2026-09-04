import { ModuleFederationPlugin } from "@module-federation/enhanced/webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "node:path";

const SHARED_SINGLETONS = [
  "react",
  "react-dom",
  "react-redux",
  "@reduxjs/toolkit",
  "@baseline/domain",
  "@baseline/contracts",
];

function sharedFor(dependencies) {
  return Object.fromEntries(
    SHARED_SINGLETONS.filter((name) => name in dependencies).map((name) => [
      name,
      {
        singleton: true,
        requiredVersion: name.startsWith("@baseline/") ? false : dependencies[name],
      },
    ]),
  );
}

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
        shared: sharedFor(dependencies),
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

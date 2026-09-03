import CopyWebpackPlugin from "copy-webpack-plugin";
import { createAppConfig } from "../../tooling/webpack.app.mjs";
import pkg from "./package.json" with { type: "json" };

export default (_env, argv) =>
  createAppConfig({
    name: "shell",
    dirname: import.meta.dirname,
    port: 8080,
    mode: argv.mode,
    dependencies: pkg.dependencies,
    plugins: [
      new CopyWebpackPlugin({
        patterns: [{ from: "public/config.json", to: "config.json" }],
      }),
    ],
  });

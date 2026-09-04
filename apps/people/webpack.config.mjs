import { createAppConfig } from "../../tooling/webpack.app.mjs";
import pkg from "./package.json" with { type: "json" };

export default (_env, argv) =>
  createAppConfig({
    name: "people",
    dirname: import.meta.dirname,
    port: 8081,
    mode: argv.mode,
    dependencies: pkg.dependencies,
    exposes: {
      "./mount": "./src/mount.tsx",
      "./api": "./src/api.ts",
    },
  });

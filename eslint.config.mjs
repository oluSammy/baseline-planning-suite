import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import importX from "eslint-plugin-import-x";
import prettier from "eslint-config-prettier";

const APP_PACKAGES = ["@baseline/shell", "@baseline/people", "@baseline/delivery"];

const UI_RUNTIME = [
  "react",
  "react/*",
  "react-dom",
  "react-dom/*",
  "react-redux",
  "@reduxjs/toolkit",
];

function forbidImports(group, message) {
  return {
    "no-restricted-imports": ["error", { patterns: [{ group, message }] }],
  };
}

export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/dist/**"] },

  js.configs.recommended,
  ...tseslint.configs.strict,

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "import-x": importX },
    files: ["apps/*/src/**/*.{ts,tsx}", "packages/*/src/**/*.{ts,tsx}"],
    rules: {
      "import-x/no-relative-packages": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  {
    files: ["apps/**/*.{ts,tsx}"],
    rules: forbidImports(
      APP_PACKAGES,
      "Apps never import each other's source. Cross-app access goes through Module Federation and  @baseline/contracts.",
    ),
  },

  {
    files: ["packages/domain/**/*.ts", "packages/contracts/**/*.ts"],
    rules: forbidImports(
      [...APP_PACKAGES, "@baseline/fixtures", ...UI_RUNTIME],
      "Domain and contracts are pure: no React, no Redux, no app or fixture code.",
    ),
  },
  {
    files: ["apps/*/src/**/*.{ts,tsx}", "packages/*/src/**/*.{ts,tsx}"],
    rules: {
      "import-x/no-relative-packages": "error",
    },
  },
  prettier,
);

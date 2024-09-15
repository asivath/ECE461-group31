import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import security from "eslint-plugin-security";
import sonarjs from "eslint-plugin-sonarjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  security.configs.recommended,
  sonarjs.configs.recommended,
  ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"),
  {
    plugins: {
      "@typescript-eslint": typescriptEslint
    },

    languageOptions: {
      globals: {},
      parser: tsParser,
      ecmaVersion: 12,
      sourceType: "module"
    },

    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "no-unreachable": "error",
      "sonarjs/sonar-no-fallthrough": "off" // This rule causes a crash: https://sonarsource.atlassian.net/browse/JS-296 when resolved get rid of this line
    }
  },
  {
    ignores: ["repos"]
  },
  {
    files: ["src/__tests__/**/*"],
    rules: {
      "security/detect-non-literal-fs-filename": "off"
    }
  }
];

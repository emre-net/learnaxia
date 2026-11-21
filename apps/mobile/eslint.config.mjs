import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: ["dist/**", ".expo/**", "node_modules/**", "nativewind-env.d.ts"],
  },
  ...compat.extends("expo"),
  {
    rules: {
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    files: ["**/metro.config.cjs", "**/*.config.cjs"],
    languageOptions: {
      globals: globals.node,
      sourceType: "commonjs",
    },
  },
];

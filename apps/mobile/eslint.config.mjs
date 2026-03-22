// https://docs.expo.dev/guides/using-eslint/
import expoConfig from "eslint-config-expo/flat.js";
import globals from "globals";

const expo = Array.isArray(expoConfig) ? expoConfig : [expoConfig];

export default [
  {
    ignores: ["dist/**", ".expo/**", "node_modules/**", "nativewind-env.d.ts"],
  },
  ...expo,
  {
    files: ["**/metro.config.cjs", "**/*.config.cjs"],
    languageOptions: {
      globals: globals.node,
      sourceType: "commonjs",
    },
  },
];

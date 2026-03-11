import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

export default [
    js.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
        },
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["warn", {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_"
            }],
            "no-undef": "off" // TypeScript handles this
        },
    },
    {
        ignores: ["node_modules/", "dist/", ".next/", "out/", ".expo/"],
    },
];

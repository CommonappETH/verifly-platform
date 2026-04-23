import js from "@eslint/js";
import tseslint from "typescript-eslint";

// Backend-only config: no React plugins, and a strict no-restricted-imports
// rule so routes/services can't reach past the portability layer.
export default tseslint.config(
  { ignores: ["dist", ".data", ".storage", "migrations"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["src/routes/**/*.ts", "src/services/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/platform/local/**", "bun:sqlite", "node:fs", "node:fs/*"],
              message:
                "Routes and services must go through `ctx.*` (import from `@/platform`), not the local adapter or bun:sqlite / node:fs directly.",
            },
          ],
        },
      ],
    },
  },
);

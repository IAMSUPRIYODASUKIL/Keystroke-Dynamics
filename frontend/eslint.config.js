import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: { "react-hooks": reactHooks },
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    rules: {
      // Classic hooks rules only. The newer React Compiler rules (set-state-in-effect, refs) flag the
      // fetch-on-mount and ref-handler patterns used throughout this codebase and don't apply without the Compiler.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
);

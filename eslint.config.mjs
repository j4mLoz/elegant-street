import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

// eslint-config-next 15 todavía publica la config en formato "eslintrc":
// FlatCompat la traduce al formato plano de ESLint 9.
const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".netlify/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "supabase/**",
      "tests/**",
    ],
  },
];

export default eslintConfig;

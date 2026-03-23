import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Node.js backend
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.node, // Node omgeving
      ecmaVersion: 2021,
    },
    rules: {
      // CamelCase voor variabelen en functies
      camelcase: ["error", { properties: "always" }],

      // Puntkomma verplicht
      semi: ["error", "always"],

      // Console logs toegestaan
      "no-console": "off",

      // MongoDB _id toegestaan
      "no-underscore-dangle": "off"
    },
  },

  // Browser JS (bijv. public/js)
  {
    files: ["public/js/**/*.js"],
    languageOptions: {
      globals: globals.browser, // Browser environment
      ecmaVersion: 2021,
    },
    rules: {
      camelcase: ["error", { properties: "always" }],
      semi: ["error", "always"],
      "no-console": "off",
      "no-unused-vars": ["warn"], // toggleMenu nog niet gebruikt → alleen waarschuwing
    },
  },
]);
import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  // input: "https://i18n-api.jinseok9338.info/docs/doc.json", // sign up at app.heyapi.dev
  input: "http://localhost:8000/docs-json",
  output: "app/api",
  plugins: ["@hey-api/client-ky", "zod", "@tanstack/react-query"],
});

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/ingest.ts"],
  format: ["esm"],
  dts: true,
  shims: true,
  clean: true,
});
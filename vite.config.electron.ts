import { defineConfig } from "vite";

/*
When building in Electron, we do not need the public directory, so we turn it off with publicDir: false.

We also need to tell Vite to build an ssr target, Electron runs on Node and not on the browser, which is what Vite targets by default, build.ssr: 'src-electron/main.ts' tells Vite just that.
*/

export default defineConfig({
  publicDir: false,
  build: {
    ssr: "src-electron/main.ts",
  },
});

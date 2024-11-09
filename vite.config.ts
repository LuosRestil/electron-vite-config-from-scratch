import { resolve } from "path";
import { spawn, type ChildProcess } from "child_process";
import { build, defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";

async function bundle(server: ViteDevServer) {
  // 'watcher' is a RollupWatcher, but Vite is doesn't export this type...
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const watcher: any = await build({
    configFile: "vite.config.electron.ts",
    build: {
      watch: {}, // to make a watcher
    },
  });

  // Dynamically import Electron and retrieve the default export (path to binary)
  const electronModule = await import("electron");
  const electron = electronModule.default as unknown as string; // path to binary

  // resolve the electron main file
  const electronMain = resolve(
    server.config.root,
    server.config.build.outDir,
    "main.js"
  );

  let electronProcess: ChildProcess | undefined;

  function closeApplication() {
    process.exit(0);
  }

  function restartElectronProcess() {
    if (electronProcess) electronProcess.kill();

    electronProcess = spawn(electron, [electronMain], { windowsHide: false });

    electronProcess.on("close", closeApplication);
  }

  function startElectron({ code }: { code: string }) {
    if (code === "END") {
      watcher.off("event", startElectron);
      restartElectronProcess();
    }
  }

  watcher.on("event", startElectron);

  // watch the build, and restart electron process on change
  watcher.on("change", () => {
    // remove close listener from existing electron process
    // so the whole app isn't closed along with it
    electronProcess?.off("close", closeApplication);
    restartElectronProcess();
  });
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // this is a vite plugin, configureServer is vite-specific
    {
      name: "electron-vite",
      configureServer(server: ViteDevServer) {
        server.httpServer?.on("listening", () => {
          bundle(server).catch(server.config.logger.error);
        });
      },
    },
  ],
});

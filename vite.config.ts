import { resolve } from "path";
import { type AddressInfo } from 'net'
import { spawn, type ChildProcess } from "child_process";
import { build, defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";

async function bundle(server: ViteDevServer) {
  // resolve the server address
  const address = server.httpServer?.address() as AddressInfo;
  const host = address.address === '127.0.0.1' ? 'localhost' : address.address;
  // build the url
  const appUrl = `http://${host}:${address.port}`;

  // 'watcher' is a RollupWatcher, but Vite is doesn't export this type...
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const watcher: any = await build({
    configFile: "vite.config.electron.ts",
    // mode is `development` when running vite 
    // mode is `production` when running vite build
    mode: server.config.mode,
    build: {
      watch: {}, // to make a watcher
    },
    define: {
      // here we define a vite replacement
      'import.meta.env.ELECTRON_APP_URL': JSON.stringify(appUrl)
    }
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
export default defineConfig(env => ({
  // Electron uses relative path to load files, 
  // but Vite uses the base option, which is / by default, 
  // therefore our application will not work when we actually build the Vite project
  // unless we override this
  // the mode can be set by the CLI
  base: env.mode === 'production' ? './' : '/',
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
}));

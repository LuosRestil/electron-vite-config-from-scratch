import { app, BrowserWindow } from "electron";

let mainWindow: BrowserWindow | undefined | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    useContentSize: true,
  });

  // when in dev mode, load the url and open the dev tools
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL(import.meta.env.ELECTRON_APP_URL);
    // mainWindow.webContents.openDevTools(); // dev tools open on start
  } else {
    // in production, close the dev tools
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow!.webContents.closeDevTools();
    });

    // load the build file instead
    mainWindow.loadFile(import.meta.env.ELECTRON_APP_URL);
  }

  mainWindow.loadURL("http://localhost:5173");
  // mainWindow.webContents.openDevTools(); // dev tools open on start

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
  // if (process.platform !== "darwin") app.quit(); // mac convention is to not quit on close
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

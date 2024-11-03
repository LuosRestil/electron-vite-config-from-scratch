import { app, BrowserWindow } from "electron";

let mainWindow: BrowserWindow | undefined | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    useContentSize: true,
  });

  mainWindow.loadURL("http://localhost:3000");
  // mainWindow.webContents.openDevTools(); // dev tools open on start

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

await app.whenReady();
createWindow();

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

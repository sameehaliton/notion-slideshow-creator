const { app, BrowserWindow, Menu, dialog, protocol } = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");
const isDev = require("electron-is-dev");

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

// Register the electron protocol to handle ESM imports
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      webviewTag: true,
      nodeIntegrationInWorker: true,
      nodeIntegrationInSubFrames: true,
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
    backgroundColor: "#f5f5f5",
  });

  // Show window when ready to prevent flickering
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Load the app
  let startUrl;
  if (isDev) {
    startUrl = "http://localhost:3000";
  } else {
    // Try multiple possible paths for the index.html file
    const possiblePaths = [
      path.join(__dirname, "client/build/index.html"),
      path.join(__dirname, "build/index.html"),
      path.join(__dirname, "client/dist/index.html"),
      path.join(__dirname, "dist/index.html"),
      path.join(app.getAppPath(), "client/build/index.html"),
      path.join(app.getAppPath(), "build/index.html"),
    ];

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        console.log("Found index.html at:", testPath);
        startUrl = url.format({
          pathname: testPath,
          protocol: "file:",
          slashes: true,
        });
        break;
      }
    }

    // If no path was found, use a default
    if (!startUrl) {
      console.log("No index.html found, using default path");
      startUrl = url.format({
        pathname: path.join(__dirname, "client/build/index.html"),
        protocol: "file:",
        slashes: true,
      });
    }
  }

  console.log("Attempting to load URL:", startUrl);
  console.log("Current directory:", __dirname);
  console.log("App path:", app.getAppPath());

  // Load the URL and handle errors
  mainWindow.loadURL(startUrl).catch((err) => {
    console.error("Failed to load URL:", err);
    // Try to load an error page
    const errorPath = path.join(__dirname, "error.html");
    if (fs.existsSync(errorPath)) {
      mainWindow.loadFile(errorPath);
    } else {
      dialog.showErrorBox(
        "Application Error",
        "Failed to load the application. Please restart or reinstall the application."
      );
    }
  });

  // Open DevTools only in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Create menu
  const template = isDev
    ? [
        {
          label: "Debug",
          submenu: [
            {
              label: "Toggle Developer Tools",
              accelerator:
                process.platform === "darwin"
                  ? "Alt+Command+I"
                  : "Ctrl+Shift+I",
              click() {
                mainWindow.webContents.toggleDevTools();
              },
            },
            { role: "reload" },
            { role: "forceReload" },
          ],
        },
      ]
    : [
        {
          label: "File",
          submenu: [{ role: "quit" }],
        },
        {
          label: "View",
          submenu: [
            { role: "reload" },
            { type: "separator" },
            { role: "togglefullscreen" },
          ],
        },
      ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Emitted when the window is closed
  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // Register the app protocol
  protocol.registerFileProtocol("app", (request, callback) => {
    const url = request.url.substring(6);
    callback({ path: path.normalize(`${__dirname}/${url}`) });
  });

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// Handle any uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  dialog.showErrorBox(
    "Application Error",
    `An unexpected error occurred: ${error.message}`
  );
});

// Use traditional CommonJS require statements
const { app, BrowserWindow, Menu, dialog, protocol } = require("electron");
const path = require("path");
const url = require("url");
const isDev = require("electron-is-dev");
const fs = require("fs");

let mainWindow;

// Register the electron protocol to handle ESM imports
app.whenReady().then(() => {
  protocol.registerFileProtocol("electron", (request, callback) => {
    const filePath = request.url.slice("electron://".length);
    callback({ path: path.normalize(`${__dirname}/${filePath}`) });
  });
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      devTools: isDev,
      webviewTag: true,
      nodeIntegrationInWorker: true,
      nodeIntegrationInSubFrames: true,
    },
    icon: path.join(
      __dirname,
      isDev ? "../build/icons/icon.png" : "../../build/icons/icon.png"
    ),
  });

  // Determine the correct path to the index.html file
  let indexPath;
  if (isDev) {
    indexPath = "http://localhost:3000";
  } else {
    // Try to find the correct path for the built index.html
    const possiblePaths = [
      path.join(__dirname, "../index.html"),
      path.join(__dirname, "../build/index.html"),
      path.join(app.getAppPath(), "build/index.html"),
      path.join(process.resourcesPath, "app.asar/build/index.html"),
    ];

    for (const testPath of possiblePaths) {
      try {
        if (fs.existsSync(testPath)) {
          indexPath = url.format({
            pathname: testPath,
            protocol: "file:",
            slashes: true,
          });
          console.log("Found index.html at:", testPath);
          break;
        }
      } catch (err) {
        console.log("Path not found:", testPath);
      }
    }

    // If no path was found, use a default
    if (!indexPath) {
      indexPath = url.format({
        pathname: path.join(__dirname, "../build/index.html"),
        protocol: "file:",
        slashes: true,
      });
    }
  }

  console.log("Loading URL:", indexPath);
  console.log("Current directory:", __dirname);
  console.log("App path:", app.getAppPath());
  console.log("Resources path:", process.resourcesPath);

  mainWindow.loadURL(indexPath);

  // Open DevTools only in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle any errors that might occur when loading the URL
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("Failed to load:", errorDescription);

      // Try an alternative path as fallback
      if (!isDev) {
        const alternativePath = url.format({
          pathname: path.join(app.getAppPath(), "build/index.html"),
          protocol: "file:",
          slashes: true,
        });
        console.log("Trying alternative path:", alternativePath);
        mainWindow.loadURL(alternativePath);
      }
    }
  );

  // Create menu with developer tools only in development mode
  const template = isDev
    ? [
        {
          label: "File",
          submenu: [{ role: "quit" }],
        },
        {
          label: "View",
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

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const path = require('path');

const remoteMain = require('@electron/remote/main');
remoteMain.initialize();

const exec = require('child_process').exec;

const isDev = process.env.IS_DEV == "true" ? true : false;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1024,
        height: 650,
        //autoHideMenuBar: true,
        resizable: false,
        frame: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
    });

    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url);
        return { action: "deny" };
    });

    mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../dist/index.html')}`
    );
    // Open the DevTools.
    if (isDev) {
        //mainWindow.webContents.openDevTools();
    };

    remoteMain.enable(mainWindow.webContents);

}

app.whenReady().then(() => {
    createWindow()
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
    exec("deviceinstaller64 install usbmmidd.inf usbmmidd", { cwd: path.join(__dirname, '/drivers') }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error}`);
            return;
        }
        console.log(`Command output:\n${stdout}`);
    });

});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      exec(
          "deviceinstaller64 stop usbmmidd",
          { cwd: path.join(__dirname, "/drivers") },
          (error, stdout, stderr) => {
            if (error) {
              console.error(`Error executing command: ${error}`);
              return;
            }
            console.log(`Command output:\n${stdout}`);
          }
        )
      app.quit()
    }
  })


// - - - HANDLE EVENTS - - -

ipcMain.handle("DESKTOP_CAPTURER_GET_SOURCES", (event, opts) =>
  desktopCapturer.getSources(opts)
);

function digitalScreen() {
    exec(
        "deviceinstaller64 enableidd 1",
        { cwd: path.join(__dirname, "/drivers") },
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Error executing command: ${error}`);
            return;
          }
          console.log(`Command output:\n${stdout}`);
        }
      );
};

ipcMain.handle("DEVICEINSTALLER64_ENABLEIDD", () =>
    digitalScreen()
);
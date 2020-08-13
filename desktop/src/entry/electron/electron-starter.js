const electron = require('electron');
const {app, ipcMain} = electron;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');
const {startExpressServer} = require('../../../express-server');
const {LocalStorage} = require('node-localstorage');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function onAppReady() {
    const twitchAuthStorage = new LocalStorage('./twitch-auth');
    global.twitchAuthStorage = twitchAuthStorage;

    twitchAuthStorage.removeItem('accessToken'); // TODO: Caching access token doesnt work properly yet. For now just dont persist it.

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    // and load the index.html of the app.
    const startUrl = process.env.ELECTRON_START_URL || url.format({
        pathname: path.join(__dirname, '/../build/index.html'),
        protocol: 'file:',
        slashes: true
    });
    mainWindow.loadURL(startUrl);

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });

    mainWindow.webContents.openDevTools();

    global.mainWindow = mainWindow;

    startExpressServer()
        .then(() => {
            console.log(`Express server listening at 'http://localhost:${global.expressServerPort}', ngrok running at '${global.ngrokUrl}'`);
        })
        .catch(error => {
            console.error(`ERROR: Could not start express server`);
            console.error(error);

            if (error.startsWith('[LCU_TIMEOUT]')) {
                electron.dialog.showErrorBox(
                    'LCU data reading timed out',
                    'This is probably because no open League client could be found. Please make sure your League client is running and restart this app.'
                );
            } else {
                mainWindow.close();
            }
        });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', onAppReady);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        onAppReady()
    }
});
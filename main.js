const electron = require('electron');
const packageJson = require('./package.json');
const {app, BrowserWindow, protocol, ipcMain} = require('electron');
const log = require('electron-log');
const path = require('path');
const h = require('./modules/Helpers.js');
const LogHandler = require('./modules/LogHandler');
const Serialport2Keybind = require('./modules/Serialport2Keybind.js');
const {conf} = require('./config.js');
const KioskWindow = require('./modules/KioskWindow');
const {download} = require('electron-dl');
const fs = require('fs');
const confJson = require('electron-json-config');
// const { keyboard, Key, mouse, left, right, up, down, screen } = require("@nut-tree/nut-js");npm i --save
const sendkeys = require('sendkeys');


const appData = {
    locale : 'et',
    idleTimeout : null,
    s2Keybind : null,
    logHandler : null,
    canPressKey : true,
    suspended : false,
    currentStatus : '',
}

let windows = null;
conf.app.version = app.getVersion();

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

const defineWindows = () =>
{
    return [
        new KioskWindow({ 
            id: 'main', 
            url: `file://${__dirname}/static/index.html`, 
            x: conf.display.primary.x, y: conf.display.primary.y, 
            w: conf.display.primary.w, h: conf.display.primary.h, 
            show: true, 
            nodeIntegration: false,
            onbeforeunload: null,
         }),
    ];
}

const createAllWindows = (w) => {
    w.forEach(win => { createWindow(win);});
};

const createWindow = win => {
    // special parent case for daemon window
    let parent = null;
    if (win.id == 'daemon') parent = h.getWin('main').instance;
    
    // Create the browser window.
    win.instance = new BrowserWindow({
        name : win.id,
        homeUrl : win.url,
        title : conf.display.mainWinTitle,
        backgroundColor: '#fff',
        width: win.w,
        height: win.h,
        x: win.x,
        y: win.y,
        parent: parent,
        show: win.show,
        frame: false,
        focusable : true,
        resizable: true,
        fullscreen: false,
        kiosk: false,
        // transparent: null,
        webPreferences: {
            nodeIntegration: win.nodeIntegration,
            enableRemoteModule: true,
            preload: path.resolve(__dirname, 'renderer.js'),
            webSecurity: false
        }
    });

    // load the url of the app.
    win.instance.loadURL(win.url);

    // hide menu
    win.instance.setMenu(null);

    // Open the DevTools.
    const isOpenDevTools = win.openDevTools != null ? win.openDevTools : conf.display.openDevTools;
    if(isOpenDevTools) win.instance.webContents.openDevTools();

    // Emitted when the window is closed.
    win.instance.on('closed', function () {
        win.instance = null;
    });
    
    if(win.id === 'main')
    {
        // close app when main window is closed
        win.instance.on('closed', () => {
            app.quit();
        });
        
        // prevent html meta title override
        win.instance.on('page-title-updated', function(e) {
            e.preventDefault()
        });
    }
}

exports.exitApp = () =>
{
    windows.forEach(element => {
        if(element.instance) element.instance.close();
        app.exit();
    });
}

exports.handleKeypress = key => {
    if(appData.canPressKey == false || appData.isSuspended == true) return;
    appData.canPressKey = false;
    const msg = {
        action : 'keypress',
        actionData : key,
        timestamp : h.getTimestamp()
    }
    // send signal to renderer window
    h.getWin('main').instance.webContents.send('keypress', msg);
    
    // simulate keystroke
    sendkeys(key).then(() => 
    {
        appData.logHandler.add({type : 'success', data : `Simulated key: ${key}`});
        appData.canPressKey = true;
    });
}

exports.toggleSuspend = () => {
    appData.isSuspended = !appData.isSuspended;
    return appData.isSuspended;
}

//////////////////////////////////////////////////////////
////////////////////// APP IS READY //////////////////////
//////////////////////////////////////////////////////////

app.on('ready', function(){
    log.info('App starting...');
    
    // check json config file, if no serial conf exists, set default
    if(!confJson.has('serial') || confJson.get('serial') == '')
    {
        confJson.set('serial', conf.serial);
        confJson.set('parsing', conf.parsing);
    }
    
    // browser window creation
    if(conf.display.getScreenDimensions) h.getScreenDimensions(conf.display, electron.screen);
    windows = defineWindows();
    h.setWindows(windows);
    
    createAllWindows(windows);

    h.getWin('main').instance.webContents.once('did-finish-load', () => {
        // pass helpers to loghandler so it can
        // send ipc messages to renderer
        appData.logHandler = new LogHandler(h, log);
        
        appData.s2Keybind = new Serialport2Keybind(confJson, exports.handleKeypress, appData.logHandler);
    })
    
    // h.getWin('daemon').instance.hide();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

//#region ipc binds
ipcMain.on('online-status-changed', (event, status) => {
    log.info('online-status-changed triggered', status);
});
//#endregion
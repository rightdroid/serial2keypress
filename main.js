const electron = require('electron');
const packageJson = require('./package.json');
const {app, BrowserWindow, protocol, ipcMain} = require('electron');
const log = require('electron-log');
const path = require('path');
const h = require('./modules/helpers.js');
const serialport2Keybind = require('./modules/serialport2Keybind.js');
const {conf} = require('./config.js');
const {KioskWindow} = require('./classes.js');
const {download} = require('electron-dl');
const fs = require('fs');
const confJson = require('electron-json-config');
const { session } = require('electron');

const appData = {
    locale : 'et',
    idleTimeout : null,
}

let windows = null;
conf.app.version = app.getVersion();

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

const defineWindows = () =>
{
    return [
        new KioskWindow({ 
            id: 'main', 
            url: `file://${__dirname}/html/index.html`, 
            x: conf.display.primary.x, y: conf.display.primary.y, 
            w: conf.display.primary.w, h: conf.display.primary.h, 
            show: true, 
            nodeIntegration: false,
            onbeforeunload: null,
            // general display settings. If not null, will override config.js settings.
            fullscreen: null,
            kiosk: null,
            focusable : null,
            resizable : null,
            frame : null,
            transparent : null,
            openDevTools : null,
         }),
        // new KioskWindow({ 
        //     id: 'daemon',
        //     url: `file://${__dirname}/html/daemon.html`, 
        //     x: conf.display.daemon.x, y: conf.display.daemon.y, 
        //     w: conf.display.daemon.w, h: conf.display.daemon.h, 
        //     show: true, 
        //     nodeIntegration: true,
        //     // general display settings. If not null, will override config.js settings.
        //     fullscreen: false,
        //     kiosk: false,
        //     focusable : false,
        //     resizable : false,
        //     frame : false,
        //     transparent : true,
        //     openDevTools : false,
        //  }),
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
        width: win.w,
        height: win.h,
        x: win.x,
        y: win.y,
        parent: parent,
        show: win.show,
        frame: win.frame != null ? win.frame : conf.display.frame,
        focusable : win.focusable != null ? win.focusable : conf.display.focusable,
        resizable: win.resizable != null ? win.resizable : conf.display.resizable,
        fullscreen: win.fullscreen != null ? win.fullscreen : conf.display.fullscreen,
        kiosk: win.kiosk != null ? win.kiosk : conf.display.kiosk,
        transparent: win.transparent != null ? win.transparent : conf.display.transparent,
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

exports.checkFileExists = fileName => {
    let result = false;
    log.info(`checking if ${fileName} exists`);
    if (fs.existsSync(`${app.getPath('userData')}/media/${fileName}`))
    {
        log.info(`${fileName} exists`);
        result = true;
    }
    else
    {
        log.info(`${fileName} does not exist`)
    }
    return result;
}

//////////////////////////////////////////////////////////
////////////////////// APP IS READY //////////////////////
//////////////////////////////////////////////////////////

app.on('ready', function(){
    log.info('App starting...');
    
    // browser window creation
    if(conf.display.getScreenDimensions) h.getScreenDimensions(conf.display, electron.screen);
    windows = defineWindows();
    h.setWindows(windows);
    
    createAllWindows(windows);
      
    h.getWin('main').instance.webContents.on('new-window', function(event, urlToOpen) {
        event.defaultPrevented = true;
        h.getWin('main').instance.loadURL(urlToOpen);
      });
    
    // h.getWin('daemon').instance.hide();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

//#region ipc binds
const returnHome = origin => {
    // reset language to estonian when backhome if called by keybind
    // eg sent from AHK script
    if(origin == 'keybind') appData.locale = 'et';
    
    const url = h.getWin('main').url;
    const browserWin = h.getWin('main').instance;
    browserWin.loadURL(`${url}?locale=${appData.locale}`);
    browserWin.webContents.once('did-finish-load', () =>{
        h.getWin('daemon').instance.hide();
        
        // clear storageData & cookies
        session.defaultSession.clearStorageData([], (data) => {})
    })
}

ipcMain.on('nav', (event, payload) => {
    if(payload.action == 'backHome')
    {
        // if video is playing, reschedule timeout after video end + 1 minute
        if(payload.actionData.videoDuration != null && payload.actionData.isVideoPlaying)
        {
            const remainingS = payload.actionData.videoDuration - payload.actionData.videoCurrentTime;
            const remainingMs = remainingS * 1000; // conversion to ms
            const remaining = remainingMs + (1000 * 60); // add 1 minute after video ends
            if (appData.idleTimeout != null) clearTimeout(appData.idleTimeout);
            appData.idleTimeout = setTimeout(function(){
                returnHome(payload.actionData.origin);
                idleTimeout = null;
            }, remaining);
        }
        else
        {
            returnHome(payload.actionData.origin);
        }
    }
    
    if(payload.action == 'leaveHome')
    {
        h.getWin('daemon').instance.show();
    }
});

// sync locale change on page with appData locale
ipcMain.on('locale', (event, payload) => {
    if(payload.action == 'localeChange')
    {
        appData.locale = payload.data.locale;
    }
});


ipcMain.on('online-status-changed', (event, status) => {
    log.info('online-status-changed triggered', status);
});

ipcMain.on('download-media', async (event, url) => {
    const win = BrowserWindow.getFocusedWindow();
    await download(win, url, 
        {
            directory : `${app.getPath('userData')}/media/`,
            onProgress : (percent) => {
                if(percent == 1) log.info(`done downloading: ${url}`);
            },
        });
});
//#endregion
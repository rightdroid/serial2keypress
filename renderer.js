// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, remote } = require('electron');
window.mousetrap = require('mousetrap');
window.ipc = ipcRenderer; // for use in html where node integration is disabled

const appData = 
{
    keys : [],
    logLimit : 50,
}

window.checkFileExists = remote.require('./main').checkFileExists;
window.exitApp = remote.require('./main').exitApp;

window.mousetrap.bind(['escape'], function() {
    const wName = remote.BrowserWindow.getFocusedWindow().webContents.browserWindowOptions.name;
    if(wName == 'main') window.exitApp();
    return false;
});

window.mousetrap.bind(['f3'], function() {
    const wName = remote.BrowserWindow.getFocusedWindow().webContents.browserWindowOptions.name;
    const currentUrl = new URL(remote.BrowserWindow.getFocusedWindow().webContents.getURL());
    const homeUrl = new URL(remote.BrowserWindow.getFocusedWindow().webContents.browserWindowOptions.homeUrl);
    if(wName == 'main')
    {
        let actionData = {origin: 'keybind'};
        
        // set actionData if we are on homepage. 
        // If appData exists and hosts match, we should be on homepage
        if(typeof(appData) !== 'undefined' && currentUrl.host == homeUrl.host)
        {
            actionData = {
                videoDuration : appData.currentVideo != null ? parseFloat(appData.currentVideo.duration) : null,
                videoCurrentTime : appData.currentVideo != null ? parseFloat(appData.currentVideo.currentTime) : null,
                isVideoPlaying : appData.isVideoPlaying,
                origin: 'keybind',
            }
        }
        ipcRenderer.send('nav', 
            {
                action : 'backHome',
                actionData : actionData
            }
        );
    }
    return false;
});

renderKeys = () =>{
    const keysNode = document.getElementById('sentKeys');
    if(keysNode != null)
    {
        keysNode.innerHTML = '';
        for(i = 0, j = appData.keys.length; i < j; i++)
        {
            // create keynode
            var keyNode = document.createElement('code');
            keyNode.className = 'sentKey';
            keyNode.innerHTML = `${appData.keys[i].data} (${appData.keys[i].timestamp})`;
            
            keysNode.prepend(keyNode);
        }
    }
}

addKey = key => {
    const keyObj = {
        data: key,
        timestamp : Date.now(),
    }
    appData.keys.push(keyObj);
    if(appData.keys.length > appData.logLimit)
        appData.keys.shift();
}

ipcRenderer.on('keypress',  (event, msg) => {   
    addKey(msg.actionData);
    renderKeys();
}

);
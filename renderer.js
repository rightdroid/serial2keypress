// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, remote } = require('electron');
window.mousetrap = require('mousetrap');
window.ipc = ipcRenderer; // for use in html where node integration is disabled
const win = remote.getCurrentWindow();

const appData = 
{
    keys : [],
    logs : [],
    logLimit : 50,
}

// When document has loaded, initialise
document.onreadystatechange = (event) => {
    if (document.readyState == "complete") {
        handleWindowControls();
    }
};

window.onbeforeunload = (event) => {
    win.removeAllListeners();
}

const {exitApp, handleKeypress, toggleSuspend} = remote.require('./main');

window.mousetrap.bind(['escape'], function() {
    const wName = remote.BrowserWindow.getFocusedWindow().webContents.browserWindowOptions.name;
    if(wName == 'main') exitApp();
    return false;
});

window.mousetrap.bind(['v'], function() {
    const wName = remote.BrowserWindow.getFocusedWindow().webContents.browserWindowOptions.name;
    if(wName == 'main') 
    {
        handleKeypress('V{enter}');
    }
    return false;
});

window.mousetrap.bind(['f3'], function() {
    handleSuspend();
    return false;
});

const handleSuspend = () => {
    isSuspended = toggleSuspend();
    const statusNode = document.getElementById('suspendStatusIndicator');
    const buttonNode = document.getElementById('toggleSuspend');
    if(isSuspended)
    {
        statusNode.classList.add('suspended');
        statusNode.title = 'Currently suspended'
        buttonNode.innerHTML = 'keys suspended';
    }
    else
    {   
        statusNode.classList.remove('suspended');
        statusNode.title = 'Currently active'
        buttonNode.innerHTML = 'keys active';
    }
}

const renderKeys = () =>{
    const keysNode = document.getElementById('sentKeys');
    if(keysNode != null)
    {
        keysNode.innerHTML = '';
        for(i = 0, j = appData.keys.length; i < j; i++)
        {
            // build key node
            const keyWrapper = document.createElement('div');
            const key = document.createElement('div');
            const timestamp = document.createElement('div');
            keyWrapper.className = 'sentKey';
            key.className = 'key';
            timestamp.className = 'timestamp';
            
            key.innerHTML = appData.keys[i].data;
            timestamp.innerHTML = `(${appData.keys[i].timestamp})`;
            
            keyWrapper.append(key);
            keyWrapper.append(timestamp);
            
            // prepend to wrapper
            keysNode.prepend(keyWrapper);
        }
    }
}

const renderLog = () => {
    const logsNode = document.getElementById('logsWrapper');
    if(logsNode != null)
    {
        logsNode.innerHTML = '';
        for(i = 0, j = appData.logs.length; i < j; i++)
        {
            // build key node
            const logWrapper = document.createElement('div');
            const logType = document.createElement('div');
            const logData = document.createElement('div');
            const timestamp = document.createElement('div');
            
            logType.innerHTML = `[${appData.logs[i].type}]<br/>`;
            logData.innerHTML = `${appData.logs[i].data}`;
            timestamp.innerHTML = `${appData.logs[i].timestamp}`;
            
            logWrapper.className = 'logWrapper';
            logType.className = `logType log-${appData.logs[i].type}`;
            logData.className = 'logData';
            timestamp.className = 'timestamp';
            
            
            logWrapper.append(timestamp);
            logWrapper.append(logType);
            logWrapper.append(logData);
            
            // prepend to wrapper
            logsNode.prepend(logWrapper);
        }
    }
}

const renderStatus = msg => {
    const logsNode = document.getElementById('statusState');
    const indicatorNode = document.getElementById('statusStateIndicator');
    if(logsNode != null)
    {
        const data = msg.actionData;
        const lastMsg = data[data.length-1]
        // TODO implement proper error code system
        // eg 1- Scanning, 10 - Error due to occupied port etc
        if(lastMsg.type == 'info' && lastMsg.data.includes('Scanning'))
        {
            logsNode.innerHTML = 'Scanning ports';
            indicatorNode.className = '';
        }
        if(lastMsg.type == 'error' && lastMsg.data.includes('Access Denied'))
        {
            logsNode.innerHTML = 'Error encountered';
            indicatorNode.className = '';
            indicatorNode.classList.add('statusError');
        }
        if(lastMsg.type == 'success' && lastMsg.data.includes('Choosing'))
        {
            logsNode.innerHTML = `Connected to ${lastMsg.extraData.comName}, baud rate ${lastMsg.extraData.baudrate}`;
            indicatorNode.className = '';
            indicatorNode.classList.add('statusSuccess');
        }
    }
}

// keep count of keys and start erasing them when
// reached display limit
const addKey = msg => {
    const keyObj = {
        data: msg.actionData,
        timestamp : msg.timestamp,
    }
    appData.keys.push(keyObj);
    if(appData.keys.length > appData.logLimit)
        appData.keys.shift();
}

const handleWindowControls = () => {
    // Make minimise/maximise/restore/close buttons work when they are clicked
    document.getElementById('min-button').addEventListener("click", e => {
        win.minimize();
    });

    document.getElementById('max-button').addEventListener("click", e => {
        win.maximize();
    });

    document.getElementById('restore-button').addEventListener("click", e => {
        win.unmaximize();
    });

    document.getElementById('close-button').addEventListener("click", e => {
        exitApp();
    });
    
    document.getElementById('toggleSuspend').addEventListener("click", e => {
        handleSuspend();
    });

    // Toggle maximise/restore buttons when maximisation/unmaximisation occurs
    toggleMaxRestoreButtons();
    win.on('maximize', toggleMaxRestoreButtons);
    win.on('unmaximize', toggleMaxRestoreButtons);

    function toggleMaxRestoreButtons() {
        if (win.isMaximized()) {
            document.body.classList.add('maximized');
        } else {
            document.body.classList.remove('maximized');
        }
    }
}

ipcRenderer.on('keypress',  (event, msg) => {   
    addKey(msg);
    renderKeys();
});

ipcRenderer.on('log',  (event, msg) => {
    appData.logs = msg.actionData;
    renderLog();
    renderStatus(msg);
});
// autoUpdater currently not implemented
autoUpdater.on('checking-for-update', () => {
    log.info('autoUpdater checking-for-update');
    notiObj.status = 'Checking for update';
    sendIpcMsg(h.getWin('notification', windows), notiObj);
});

autoUpdater.on('update-available', (info) => {
    log.info(`autoUpdater update-available: ${info.url}`);
    h.getWin('notification', windows).instance.show();
    notiObj.status = 'Update will be installed when download completes. App will be restarted';
    notiObj.dlStatus = 'Starting download';
    notiObj.newVer = info.version;
    notiObj.currentVer = conf.app.version;
    notiObj.releaseDate = info.releaseDate;
    sendIpcMsg(h.getWin('notification', windows), notiObj);
});

autoUpdater.on('update-not-available', (info) => {
    log.info('autoUpdater update-not-available');
    notiObj.reset();
    notiObj.currentVer = conf.app.version;
    sendIpcMsg(h.getWin('notification', windows), notiObj);
});

autoUpdater.on('error', (err) => {
    log.error(`autoUpdater error: ${err}`);
    notiObj.status = 'Oops. We encountered an error on updating. Please contact sysadmin for help'.
    notiObj.dlStatus = 'Error in auto-updater.';
    sendIpcMsg(h.getWin('notification', windows), notiObj);
});

autoUpdater.on('download-progress', (progressObj) => {
    log.info(`autoUpdater download-progress: ${progressObj.transferred}`);
    notiObj.dlStatus = 'Download in progress';
    notiObj.dlSpeed = `${(progressObj.bytesPerSecond / 125000).toFixed(3)} Mbps`;
    notiObj.dlProgressPercent = Math.floor(progressObj.percent);
    notiObj.dlProgressAmount = `${h.kbToMb(progressObj.transferred)} / ${h.kbToMb(progressObj.total)} Mb`;
    sendIpcMsg(h.getWin('notification', windows), notiObj);
});

autoUpdater.on('update-downloaded', (info) => {
    log.info(`autoUpdater update-downloaded: ver: ${info.version}, date: ${info.releaseDate}`);
    notiObj.status = 'Update Downloaded. App restart pending...'
    notiObj.dlStatus = 'Download finished'
    sendIpcMsg(h.getWin('notification', windows), notiObj);
    setTimeout(() => {
        autoUpdater.quitAndInstall();
    }, 3000);
});
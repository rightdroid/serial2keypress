const conf = {
    app : 
    {
        version : null, // dynamically fetched on app start
    },
    display : 
    {
        mainWinTitle : 'Karjäärikeskuse kodu',
        // these are overridden by individual browserWindow settings
        getScreenDimensions : true, // finds primary and secondary display values via electron
        preventNewTabs : true, // prevent opening links in new tabs
        openDevTools : false,
        kiosk : false,
        fullscreen : true,
        resizable : true,
        frame : true,
        focusable : true,
        transparent : null,
        notiWinIgnoreMouseEvents : false,  // Ignore Mouse so that it cannot be closed by user input
        primary : 
        {
            x : 0,
            y : 0,
            w : 1200,
            h : 700,
        },
        secondary : 
        {
            x : 0,
            y : 0,
            w : 0,
            h : 0,
        },
        overlay : 
        {
            x : 40,
            y : 960,
            w : 80,
            h : 80,
        },
    }
}

module.exports.conf = conf;
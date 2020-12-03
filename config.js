const conf = {
    app : 
    {
        version : null, // dynamically fetched on app start
    },
    serial : {
        acceptedPortManufacturers : [
            'wch.cn',
            'arduino.cc',
        ],
        baudRate : 9600,
    },
    parsing : 
    {
        prefix : 'kb',
        delimiter : ':'
    },
    display : 
    {
        mainWinTitle : 'Serial 2 KeyPress',
        // these are overridden by individual browserWindow settings
        getScreenDimensions : false, // finds primary and secondary display values via electron
        preventNewTabs : true, // prevent opening links in new tabs
        openDevTools : false,
        kiosk : false,
        fullscreen : false,
        resizable : true,
        frame : false,
        focusable : true,
        transparent : null,
        notiWinIgnoreMouseEvents : false,  // Ignore Mouse so that it cannot be closed by user input
        primary : 
        {
            x : 0,
            y : 0,
            w : 530,
            h : 455,
        },
        secondary : 
        {
            x : 0,
            y : 0,
            w : 0,
            h : 0,
        },
        daemon : 
        {
            x : 40,
            y : 960,
            w : 80,
            h : 80,
        },
    }
}

module.exports.conf = conf;
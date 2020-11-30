class Helpers
{
    constructor() {
        this.windows = null;
    }
    
    setWindows = windows => {
        this.windows = windows;
    }
    
    getWin = (id, windows = null) =>
    {
        let toReturn = null;
        if (windows == null) windows = this.windows;
        for (let i = 0; i < windows.length; i++) {
            if (windows[i].id == id)
            {
                toReturn = windows[i];
                break;
            }
        }
        return toReturn;
    }
    
    getScreenDimensions = (display, screen) => 
    {
        display.primary.w = screen.getPrimaryDisplay().workAreaSize.width;
        display.primary.h = screen.getPrimaryDisplay().workAreaSize.height;
        const externalD = screen.getAllDisplays().find((display) => {
            return display.bounds.x !== 0 || display.bounds.y !== 0
        })
        if (externalD) { // secondary display exists
            display.secondary.w = externalD.bounds.width;
            display.secondary.h = externalD.bounds.height;
            display.secondary.x = externalD.bounds.x;
            display.secondary.y = externalD.bounds.y;
        }
    }
    
    kbToMb = v => (v / Math.pow(10, 6)).toFixed(2);
    
}


// export default { getWinById, foo };
module.exports = new Helpers();
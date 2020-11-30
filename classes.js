
class KioskWindow {
    constructor({ ...args }) {
        for (const [k, v] of Object.entries(args)) {
            this[k] = v;
        }
    }
}

class UpdateNotification
{
    defaults = {
       title : 'Autoupdater',
       status : 'You have the latest version.',
       currentVer : '...',
       newVer : '...',
       dlStatus : '...',
       dlSpeed : '...',
       dlProgressPercent : 0,
       dlProgressAmount : '',
       releaseDate : '',
       logPath : '',
    }
    
    constructor()
    {
        this.reset();
    }
    
    reset = () =>
    {
        Object.entries(this.defaults).forEach(key => {
            this[key[0]] = key[1]
         });
    }
}

module.exports = 
{
    KioskWindow : KioskWindow,
    UpdateNotification : UpdateNotification,
}
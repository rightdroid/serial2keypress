class LogHandler
{
    constructor(helpers, electronLog) {
        this.logs = [];
        this.h = helpers;
        this.electronLog = electronLog;
    }
    
    add = (type, message, timestamp) => {
        const log = {
            type : type,
            data : message,
            timestamp : timestamp == null ? this.h.getTimestamp() : timestamp 
        }
        this.logs.push(log);
        this.sendSignal();
        
        if(this.electronLog[type] != null) this.electronLog[type](message);
    }
    
    remove = () => {
        
    }
    
    getLast = () => {
        return this.logs.pop();
    }
    
    sendSignal = () => {
        // const log = this.getLast();
        // send all logs
        const msg = {
            action : 'log',
            actionData : this.logs
        }
        this.h.getWin('main').instance.webContents.send('log', msg);
    }
    
}


// export default { getWinById, foo };
module.exports = LogHandler;
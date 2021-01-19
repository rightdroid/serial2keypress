class LogHandler
{
    constructor(helpers, electronLog) {
        this.logs = [];
        this.h = helpers;
        this.electronLog = electronLog;
    }
    
    add = ({type, data, timestamp, extraData}) => {
        const log = {
            type : type,
            code : null,
            data : data,
            extraData : extraData || null,
            timestamp : timestamp == null ? this.h.getTimestamp() : timestamp 
        }
        this.logs.push(log);
        console.log(log);
        this.sendSignal();
        
        if(this.electronLog[type] != null) this.electronLog[type](data);
    }
    
    remove = () => {
        // not implemented
    }
    
    getLast = () => {
        return this.logs.pop();
    }
    
    sendSignal = () => {
        // send all logs
        const msg = {
            action : 'log',
            actionData : this.logs,
        }
        this.h.getWin('main').instance.webContents.send('log', msg);
    }
}

module.exports = LogHandler;
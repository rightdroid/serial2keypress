const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');


class Serialport2Keybind
{
    constructor(confJson, keybindCallback, logHandler, helpers)
    {
        this.socket = null;
        this.serialport = null;
        this.initialScanLaunched = false;
        
        this.acceptedPortManufacturers = confJson.get('serial').acceptedPortManufacturers;
        this.baudRate = confJson.get('serial').baudRate;
        this.parsePrefix = confJson.get('parsing').prefix;
        this.parseDelimiter = confJson.get('parsing').delimiter;
        
        this.timers = {
            checkSerialPort : {
                inst : null,
                ms : 3000,
            },
        };
        this.comName = null;
        this.parser = null;
        this.callbackFunc = keybindCallback;
        this.logHandler = logHandler;
        this.h = helpers;
        
        this.scanPorts();
    }

    retrySerialConnection = (reason, msg) =>{
        // clear timeout
        if(this.timers.checkSerialPort.timer != null) clearTimeout(this.timers.checkSerialPort.timer);
        
        if(msg.includes('Access denied'))
        {
            this.logHandler.add('error', `Access Denied to COM Port. Aborting trying to connect.`);
            return; // dont retry when access is denied
        }
        
        this.timers.checkSerialPort.timer = setTimeout(() => {
            this.scanPorts();
        }, this.timers.checkSerialPort.ms);
    }

    setupDataParsing = () => {
        this.logHandler.add('info', 
        `Setting up data parsing<br/>Using prefix\
         <code>${this.parsePrefix}</code>, delimiter <code>${this.parseDelimiter}</code>`);
        this.parser.on('data', data => {
            if(data.includes(this.parsePrefix))
            {
                // data processing
                const msg = data.split(this.parseDelimiter);
                const key = msg[1].trim();
                
                this.callbackFunc(key);
            }
            else
                this.logHandler.add('warning', `Serial data mismatch. Data: ${data}`);
        });
    }

    scanPorts = () => {
        this.initialScanLaunched = true;
        SerialPort.list().then(
            ports => {
                this.comName = null;
                let portLog = 'Scanning ports<br/>COMPORTS<br/>--------------------------<br/>';
                
                ports.forEach(port => {
                    portLog += `${port.path}\t${port.pnpId || ''}\t${port.manufacturer || ''}<br/>`;
                    // filter out correct COMport name
                    if(this.acceptedPortManufacturers.some(el => port.manufacturer.includes(el)))
                        this.comName = port.path;
                })
                
                portLog += '--------------------------';
                this.logHandler.add('info', portLog);
                
                if(this.comName != null)
                {
                    // console.log(`choosing port: ${this.comName}`);
                    this.logHandler.add('success', `Choosing port: ${this.comName}. Using baud rate ${this.baudRate}.`);
                    
                    this.serialport = new SerialPort(this.comName, {
                        baudRate: this.baudRate
                    })
                    
                    this.serialport.once('error', (err) => {
                        // got error, try to reconnect
                        this.retrySerialConnection('error', err.message);
                        this.logHandler.add('error', `Retrying connection: ${err.message}`);
                    })
                    
                    this.serialport.once('close', () => {
                        // port disconnected, try to reconnect
                        this.retrySerialConnection('closed', `${this.comName} connection closed`);
                        this.logHandler.add('error', `Retrying connection: Port closed/disconnected.`);
                    });
                    
                    this.parser = this.serialport.pipe(new Readline());
                    this.parser.isRunning = false;
                    
                    this.setupDataParsing();
                }
                else
                {
                    // no comName match, try again;;
                    this.retrySerialConnection('noMatch', 'no COM Port name match, retrying...');
                    this.logHandler.add('warning', `No COM Port name match, retrying...`);
                    
                }
            },
            err => {
                this.logHandler.add('error', `Error listing ports: ${err}`);
            }
        )
    }
}

// module.exports.Serialport2Keybind = Serialport2Keybind;
module.exports = Serialport2Keybind;
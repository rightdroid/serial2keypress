const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const {webContents} = require('electron');


class Serialport2Keybind
{
    constructor(keybindCallback)
    {
        this.socket = null,
        this.serialport = null,
        this.initialScanLaunched = false,
        this.acceptedPortManufacturers = [
            'wch.cn',
            'arduino.cc',
        ],
        this.timers = {
            checkSerialPort : {
                inst : null,
                ms : 3000,
            },
        }
        this.comName = null;
        this.parser = null;
        this.callbackFunc = keybindCallback;
        
        this.scanPorts();
    }

    // const { keyboard, Key, mouse, left, right, up, down, screen } = require("@nut-tree/nut-js");

    retrySerialConnection = (reason, msg) =>{
        console.log(`Retrying connection: ${msg}`)
        // clear timeout
        if(this.timers.checkSerialPort.inst != null) clearTimeout(this.timers.checkSerialPort.inst);
        
        if(msg.includes('Access denied')) return; // dont retry when access is denied
        
        this.timers.checkSerialPort.inst = setTimeout(() => {
            this.scanPorts();
        }, this.timers.checkSerialPort.ms);
    }

    sendKey = async(key) => {
        // await keyboard.pressKey(Key[key]);
        // await keyboard.releaseKey(Key[key]);
        console.log(`Sending key ${key}`);
        this.callbackFunc(key);
        // webContents.send('keypress', 
        //     {
        //         action : 'keypress',
        //         actionData : key
        //     }
        // );
    }

    setupDataParsing = () => {
        console.log(`setting up data parsing`);
        this.parser.on('data', data => {
            if(data.includes('kb'))
            {
                // data processing
                const msg = data.split(':');
                const key = msg[1].trim();
                console.log(`kb: ${key}`);
                
                // TODO set up a queue with keypresses
                // then process then with async
                this.sendKey(key);
                
                // if(this.socket != null) this.socket.emit('hr', hr);
            }
            else
            {
                // console.log(`data: ${data}`);
            }
        });
    }

    scanPorts = () => {
        console.log('scanning ports');
        this.initialScanLaunched = true;
        SerialPort.list().then(
            ports => {
                this.comName = null;
                
                console.log('\n');
                console.log('COMPORTS');
                console.log('--------------------------');
                ports.forEach(port => {
                    console.log(`${port.path}\t${port.pnpId || ''}\t${port.manufacturer || ''}`);
                    // filter out correct COMport name
                    if(this.acceptedPortManufacturers.some(el => port.manufacturer.includes(el)))
                        this.comName = port.path;
                })
                console.log('--------------------------');
                
                if(this.comName != null)
                {
                    console.log(`choosing port: ${this.comName}`);
                    this.serialport = new SerialPort(this.comName, {
                        baudRate: 9600
                    })
                    
                    this.serialport.once('error', (err) => {
                        // got error, try to reconnect
                        this.retrySerialConnection('error', err.message);
                    })
                    
                    this.serialport.once('close', () => {
                        // port disconnected, try to reconnect
                        this.retrySerialConnection('closed', `${this.comName} connection closed`);
                    });
                    
                    this.parser = this.serialport.pipe(new Readline());
                    this.parser.isRunning = false;
                    
                    this.setupDataParsing();
                }
                else
                {
                    // no comName match, try again;;
                    this.retrySerialConnection('noMatch', 'no COM Port name match, retrying...');
                }
            },
            err => {
                console.error('Error listing ports', err)
            }
        )
    }
}

// module.exports.Serialport2Keybind = Serialport2Keybind;
module.exports = Serialport2Keybind;
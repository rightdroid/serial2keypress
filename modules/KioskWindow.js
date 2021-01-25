class KioskWindow {
    constructor({ ...args }) {
        for (const [k, v] of Object.entries(args)) {
            this[k] = v;
        }
    }
}

module.exports = KioskWindow;
const { app, BrowserWindow} = require('electron/main')
const path = require('node:path')

app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        minHeight: 600,
        minWidth: 800,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html')
    win.webContents.openDevTools()
    win.removeMenu()
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
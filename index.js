const { app, BrowserWindow, screen } = require('electron/main')
const path = require('node:path')
const pipeline = require("./static/python-pipeline")

app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function createWindow() {
    pipeline.connectToPythonPipeline()
    let settings = await pipeline.interactWithPythonPipeline({
        "object": "pass_current_settings",
        "args": [],
        "kwargs": {}
    })
    const win = new BrowserWindow({
        width: settings["UI"]["WINDOW_WIDTH"],
        height: settings["UI"]["WINDOW_HEIGHT"],
        minHeight: 600,
        minWidth: 800,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    pipeline.wipePythonPipeline()

    win.loadFile('index.html')
    win.webContents.openDevTools()
    win.removeMenu()
    if (settings["UI"]["MAXIMIZED"] === true) {
        win.maximize()
    }

    let close_callback = async (e) => {
        e.preventDefault();
        win.hide();
        win.loadURL('about:blank');
        await sleep(2000)
        pipeline.connectToPythonPipeline()
        let isMaximized = win.isMaximized()
        let [width, height] = win.getSize()
        await pipeline.interactWithPythonPipeline({
            "object": "update_ui_setting",
            "args": ["WINDOW_WIDTH", width],
            "kwargs": {}
        });
        await pipeline.interactWithPythonPipeline({
            "object": "update_ui_setting",
            "args": ["WINDOW_HEIGHT", height],
            "kwargs": {}
        });
        await pipeline.interactWithPythonPipeline({
            "object": "update_ui_setting",
            "args": ["MAXIMIZED", isMaximized],
            "kwargs": {}
        });
        await pipeline.interactWithPythonPipeline({
            "object": "save_settings",
            "args": [],
            "kwargs": {}
        });
        pipeline.wipePythonPipeline();
        console.log(width, height, isMaximized);

        win.off("close", close_callback);
        win.destroy();
    }

    win.on("close", close_callback)

    win.show()

    return win;
}

let win;

app.whenReady().then(() => {
    win = createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            win = createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
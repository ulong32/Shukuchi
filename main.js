"use strict";
const fs = require('fs');


const { app, BrowserWindow, dialog, Menu, shell, ipcMain } = require('electron');
const path = require('path');

let isSetNoTimeout = false;
let isLockAspectRatio = false;
let key = null;
let idMainWindow = null;

const setAspectRatio = (win, windowSize, UISize, edge, currentSize, posWindow) => {
    
    switch(edge) {
        case 'bottom':
            win.setSize(Math.round((currentSize.height - UISize[1]) * 16 / 9) + UISize[0], currentSize.height);
            break;
        case 'left':
            break;
        case 'right':
            win.setSize(currentSize.width, Math.round((currentSize.width - UISize[0]) * 9 / 16) + UISize[1]);
            break;
        case 'top-left':
        case 'bottom-left':
            break;
        default:
            if(Math.abs(currentSize.height - windowSize[1]) - Math.abs(currentSize.width - windowSize[0]) > 0) {
                win.setSize(currentSize.width, Math.round((currentSize.width - UISize[0]) * 9 / 16) + UISize[1]);
            } else {
                win.setSize(Math.round((currentSize.height - UISize[1]) * 16 / 9) + UISize[0], currentSize.height);
            }
            break;
    }
}

const createMainWindow = () => {

    const configData = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    const win = new BrowserWindow({
        width: parseInt(configData['winWidth']),
        height: parseInt(configData['winHeight']),
        title: 'Shukuchi',
        icon: path.join(__dirname, 'icon.png'),
        useContentSize: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    idMainWindow = win.id;
    win.webContents.on('new-window', (e, url) => {
        shell.openExternal(url);
    });
    ipcMain.on('change-fullscreen', () => {
        if (win.isFullScreen()){
            win.setFullScreen(false);
            win.setMenuBarVisibility(true);
            win.setAutoHideMenuBar(false);
        } else {
            win.setFullScreen(true);
            win.setMenuBarVisibility(false);
            win.setAutoHideMenuBar(false);
        }
    });
    win.on('will-resize', (e,size,detail) => {
        if (!isLockAspectRatio) return;
        const windowSize = win.getSize();
        const contentSize = win.getContentSize();
        const UISize = [windowSize[0] - contentSize[0],windowSize[1] - contentSize[1]];
        const currentSize = size;
        const edge = detail.edge;
        const posWindow = win.getPosition();
        e.preventDefault();
        setAspectRatio(win, windowSize, UISize, edge, currentSize, posWindow);
    })
    win.loadURL('https://allb-browser.pokelabo.jp/web/play?type=' + configData['playVersion']);

    win.setTitle("Shukuchi");
    
};

const createSettingWindow = () => {
    const winSetting = new BrowserWindow({
        width: 800,
        height: 600,
        useContentSize: true,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'setting.js')
        }
    });
    winSetting.loadFile('setting.html');
}

app.whenReady().then(() => {
    let existConfig = true
    try {
        fs.readFileSync('config.json', 'utf8');
    } catch(error) {
        createSettingWindow();
        existConfig = false
    }
    if (existConfig) createMainWindow();
    

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
    
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('config-save', (item,exdata) => {
    fs.writeFileSync('./config.json', exdata, 'utf8');
});

ipcMain.on('close-setting', () => {
    const wins = BrowserWindow.getAllWindows();
    wins.forEach((wind) => {
        wind.close();
    })
    createMainWindow();
});
ipcMain.on("DOM loaded", () => {
    BrowserWindow.fromId(idMainWindow).setTitle('Shukuchi');
});

const templateMenu = [
    {
        label: '&Shukuchi',
        submenu: [
            
            {
                label: '??????',
                accelerator: 'Alt+F4',
                click() { app.quit(); }
            }
        ]
    },
    {
        label: '??????(&V)',
        submenu: [
            {
                label:'??????(&R)',
                role: 'reload'
            },
            {
                type: 'separator'
            },
            {
                label: '???????????????(&S)',
                type: 'checkbox',
                click(item, focusedWindow) {
                    if (focusedWindow) {
                        if (focusedWindow.isFullScreen()){
                            focusedWindow.setFullScreen(false);
                            focusedWindow.setMenuBarVisibility(true);
                            focusedWindow.setAutoHideMenuBar(false);
                        } else {
                            focusedWindow.setFullScreen(true);
                            focusedWindow.setMenuBarVisibility(false);
                            focusedWindow.setAutoHideMenuBar(false);
                        }
                    }
                }
            },
            {
                label: '???????????????(&T)',
                type: 'checkbox',
                accelerator: 'CmdOrCtrl+T',
                click(item, focusedWindow) {
                    if (focusedWindow) {
                        if (focusedWindow.isAlwaysOnTop()) {
                            focusedWindow.setAlwaysOnTop(false);
                        } else {
                            focusedWindow.setAlwaysOnTop(true);
                        }
                    }
                }
            },
            {
                label: '????????????????????????',
                type: 'checkbox',
                click() {
                    isLockAspectRatio = !isLockAspectRatio;
                }
            }
        ]
    },
    {
        label: '?????????',
        submenu: [
            {
                label: '????????????????????????',
                type: 'checkbox',
                click(item, focusedWindow) {
                    if (isSetNoTimeout) {
                        focusedWindow.webContents.send('no-timeout-false')
                        isSetNoTimeout = false;
                    } else {
                        focusedWindow.webContents.send('no-timeout-true')
                        isSetNoTimeout = true;
                    }
                }
            },
            {
                label: '????????????????????????',
                role: 'forceReload'
            },
            {
                label: '??????????????????',
                type: 'checkbox',
                role: 'toggleDevTools'
            },
            {
                type: 'separator'
            },
            {
                label: '??????',
                click(item, focusedWindow) {
                    key = dialog.showMessageBoxSync(
                    {
                        type: 'question',
                        buttons: ['Yes', 'No'],
                        title: '??????',
                        message: '???????????????????????????',
                        detail: '?????????????????????????????????????????????????????????????????????????????????????????????\n????????????????????????'
                    });
                    if(key == 0) createSettingWindow();
                }
            }
        ]
    },
    {
        label: '?????????(&H)',
        submenu: [
            {
                label: '???????????????(&C)',
                click() {
                    key = dialog.showMessageBoxSync(
                        {
                            type:'question',
                            buttons:['Yes', 'No'],
                            title: '??????',
                            message: '????????????????????????????????????????????????',
                            detail: '???????????????Github??????????????????????????????????????????\n?????????????????????????????????????????????????????????????????????\n???????????????????????????' + app.getVersion()
                        });
                        if (key == 0) {
                            shell.openExternal("https://github.com/ulong32/Shukuchi");
                        }
                        
                    
                }
            },
            {
                label: 'Shukuchi????????????(&A)',
                click() {
                    dialog.showMessageBox(
                        BrowserWindow.getFocusedWindow(),
                        {
                            title: 'Shukuchi????????????',
                            type: 'info',
                            buttons: ['OK'],
                            message: 'Shukuchi',
                            detail: '???????????????????????????????????????????????????????????????????????????\nDev:???????????????????????????(ulong32)\n\nVersion:' + app.getVersion()
                        }
                    );
                }
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(templateMenu);
Menu.setApplicationMenu(menu);

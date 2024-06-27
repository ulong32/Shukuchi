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
    win.webContents.openDevTools();
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
                label: '終了',
                accelerator: 'Alt+F4',
                click() { app.quit(); }
            }
        ]
    },
    {
        label: '表示(&V)',
        submenu: [
            {
                label:'更新(&R)',
                role: 'reload'
            },
            {
                type: 'separator'
            },
            {
                label: '最前面表示(&T)',
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
                label: 'アスペクト比固定',
                type: 'checkbox',
                click() {
                    isLockAspectRatio = !isLockAspectRatio;
                }
            }
        ]
    },
    {
        label: 'ツール',
        submenu: [
            {
                label: 'アプリのリセット',
                role: 'forceReload'
            },
            {
                label: '開発者ツール',
                role: 'toggleDevTools'
            },
            {
                type: 'separator'
            },
            {
                label: '設定',
                click(item, focusedWindow) {
                    key = dialog.showMessageBoxSync(
                    {
                        type: 'question',
                        buttons: ['Yes', 'No'],
                        title: '確認',
                        message: '設定画面を開きます',
                        detail: '設定の反映のため、設定終了後にアプリケーションを再起動します。\nよろしいですか？'
                    });
                    if(key == 0) createSettingWindow();
                }
            }
        ]
    },
    {
        label: 'ヘルプ(&H)',
        submenu: [
            {
                label: '更新の確認(&C)',
                click() {
                    key = dialog.showMessageBoxSync(
                        {
                            type:'question',
                            buttons:['Yes', 'No'],
                            title: '確認',
                            message: 'ブラウザを開き、更新を確認します',
                            detail: 'ブラウザでGithubのリリースページを開きます。\n必要に応じて最新版をダウンロードしてください。\n現在のバージョン：' + app.getVersion()
                        });
                        if (key == 0) {
                            shell.openExternal("https://github.com/ulong32/Shukuchi/releases");
                        }
                        
                    
                }
            },
            {
                label: 'Shukuchiについて(&A)',
                click() {
                    dialog.showMessageBox(
                        BrowserWindow.getFocusedWindow(),
                        {
                            title: 'Shukuchiについて',
                            type: 'info',
                            buttons: ['OK'],
                            message: 'Shukuchi',
                            detail: 'ブラウザ版ラスバレ用のちょっと使いやすいプレイ環境\nDev:あんさいんどろんぐ(ulong32)\n\nVersion:' + app.getVersion()
                        }
                    );
                }
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(templateMenu);
Menu.setApplicationMenu(menu);

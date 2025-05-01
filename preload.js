"use strict";
const { ipcRenderer } = require("electron");

let frame = 0;
let prevFrame = 0;
let showInfoWindow = false;
let lastClickedTime = 0;

ipcRenderer.on("info-window", () => {
    showInfoWindow = !showInfoWindow;
    document.querySelector("#healthMonitor").style.display = showInfoWindow ? "block" : "none";
})


// フレームごとに呼び出される処理
const onVideoFrameUpdated = (gameWindow) => {
    gameWindow.requestVideoFrameCallback(() => {
        frame++;
        onVideoFrameUpdated(gameWindow);
    });
}

const buildInfoWindowText = (time,  width, height, frame, fps) => {
    return `Time: ${time / 1000} s
Stand for: ${Math.floor((getDate() - lastClickedTime) / 1000)} s
Resolution: ${height}x${width}
Total frame: ${frame}
FPS: ${fps}`;
}

// 統計情報ウィンドウ
window.addEventListener('DOMContentLoaded', () => {
    const healthMonitor = document.createElement("div");
    healthMonitor.id = "healthMonitor";
    healthMonitor.style = `position: fixed;
top: 0;
left: 0;
background-color: #0008;
z-index: 999999;
color: white;
padding: 5px;
pointer-events: none;`;
healthMonitor.style.display = "none";
    document.querySelector("body").appendChild(healthMonitor);
    if (window.location.href.startsWith("https://pokelabo1.now.gg")) {
        const intvId = setInterval(() => {
            const gameWindow = document.querySelector("#js-game-video");
            if (gameWindow !== null) {
                // タイトルを"Shukuchi"に設定
                ipcRenderer.send("set-title");
                lastClickedTime = getDate();
                gameWindow.addEventListener("click", () => {
                    lastClickedTime = getDate();
                })
                frame = 0;
                onVideoFrameUpdated(gameWindow);
                setInterval(() => {
                    const framePerSecond = frame - prevFrame;
                    prevFrame = frame;
                    healthMonitor.innerText = buildInfoWindowText(
                        Math.floor(gameWindow.getVideoPlaybackQuality().creationTime),
                        gameWindow.videoWidth,
                        gameWindow.videoHeight,
                        frame,
                        framePerSecond
                    );
                }, 1000);
                clearInterval(intvId);
            }
        },100);
    }
    const intvId = setInterval(() => {
        const iframe = document.querySelector("iframe");

        if (iframe.src.startsWith("https://pokelabo1.now.gg")) {
            window.location.href = iframe.src;
            clearInterval(intvId);
        }
    }, 500);
});

const setKeyboardShortcut = (element) => {
    element.addEventListener("keydown", (e) => {
        console.log("str");
        console.log(e.key);
        if(e.ctrlKey) {
            if(e.shiftKey) {
                switch(e.key) {
                    case "i":
                        ipcRenderer.send("toggle-devtool");
                        break;
                    case "r":
                        window.location.href = window.location.href;
                }
            }
        }
    })
}

const getDate = () => {
    return Date.now();
};

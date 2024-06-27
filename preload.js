"use strict";
const { ipcRenderer } = require('electron');

let intervalID = null; 

window.addEventListener('DOMContentLoaded', () => {
});

function clickCanvas() {
    document.getElementsByTagName('canvas')[0].click()
}

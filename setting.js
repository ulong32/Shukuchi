"use strict";

const {ipcRenderer} = require("electron");

window.addEventListener('DOMContentLoaded', () => {
    const chkAuto = document.getElementById("chkAuto");
    const numHeight = document.getElementById("numHeight");
    const btnExport = document.getElementById("btnExport");

    chkAuto.addEventListener('input', () => {
        if(document.getElementById("chkAuto").checked){
        document.getElementById("numWidth").disabled = true;
        }else {
        document.getElementById("numWidth").disabled = false;
        }
    });

    numHeight.addEventListener('input', () => {
        if(document.getElementById("chkAuto").checked){
            let height = parseInt(document.getElementById("numHeight").value)
            let width = parseInt(height * 16 / 9)
            document.getElementById("numWidth").value = width
        }
    });

    btnExport.addEventListener('click', () => {
        const data = {
            playVersion: document.getElementById('radioLogin').elements["radioLogin"].value,
            winHeight: document.getElementById('numHeight').value,
            winWidth: document.getElementById('numWidth').value,
        }
        ipcRenderer.send('config-save', JSON.stringify(data, undefined, 2));
        ipcRenderer.send('close-setting');
    })


})


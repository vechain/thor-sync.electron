const { initializeEvalHandler } = require('electron-remote')
initializeEvalHandler()

function showIsOk(message: string): void {
  console.log(message)
}

// let win = window
// win.showIsOk = showIsOk

function init(win: any) {
  win.showIsOk = showIsOk
}

init(window)

const remote = require('electron').remote
const win = remote.getCurrentWindow()
const style = 'full-screen'
let bodyEle = document.body
let platform = process.platform

function init() {
  bodyEle.classList.add(platform)
  if (win.isFullScreen()) {
    bodyEle.classList.add(style)
  } else {
    bodyEle.classList.remove(style)
  }

  win.on('enter-full-screen', function() {
    bodyEle.classList.add(style)
  })
  win.on('leave-full-screen', function() {
    bodyEle.classList.remove(style)
  })
}
init()

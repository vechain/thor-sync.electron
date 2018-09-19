import { remote } from 'electron'
const win = remote.getCurrentWindow()
const style = 'full-screen'
const bodyEle = document.body
const platform = process.platform

declare interface ILib {
    sign?(contentId: number, clause?: object[]): Promise<string>
}

declare global {
    interface Window {
        Lib: ILib
    }
}

window.Lib = {
}

function init() {
    bodyEle.classList.add(platform)
    if (win.isFullScreen()) {
        bodyEle.classList.add(style)
    } else {
        bodyEle.classList.remove(style)
    }

    win.on('enter-full-screen', () => {
        bodyEle.classList.add(style)
    })
    win.on('leave-full-screen', () => {
        bodyEle.classList.remove(style)
    })
}
init()
